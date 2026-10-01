"""Delivery orders, dispatch allocation and lifecycle updates (FR3/FR4/FR5/FR7).

Authorisation note: administrators see the whole fleet. A driver token is *scoped to its
own waybills* — the `driverId` query parameter is overridden rather than trusted, and a
driver cannot read or advance a delivery that is not assigned to them.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from errors import forbidden, not_found, validation_error
from extensions import db
from models import (
    DELIVERY_STATUSES,
    Customer,
    Delivery,
    DeliveryItem,
    Driver,
    Product,
    Vehicle,
)
from notifications import emit
from routes.auth import admin_required, current_user
from serializers import delivery_to_dict
from services import advance_delivery_status, allocate_delivery, generate_tracking_code

deliveries_bp = Blueprint("deliveries", __name__)


def _load_delivery(delivery_id: int) -> Delivery:
    delivery = db.session.get(Delivery, delivery_id)
    if delivery is None:
        raise not_found("Delivery not found.")
    return delivery


def _assert_can_access(user, delivery: Delivery) -> None:
    """Drivers may only touch their own waybills."""
    if user.role == "driver" and delivery.driver_id != user.driver_id:
        raise forbidden("This delivery is not assigned to you.")


@deliveries_bp.get("/api/deliveries")
@jwt_required()
def list_deliveries():
    user = current_user()
    query = Delivery.query

    status = request.args.get("status")
    if status and status != "all":
        if status not in DELIVERY_STATUSES:
            raise validation_error(f"Unknown delivery status '{status}'.")
        query = query.filter(Delivery.status == status)

    if user.role == "driver":
        # Ignore any client-supplied driverId — scope to the authenticated rider.
        query = query.filter(Delivery.driver_id == user.driver_id)
    else:
        driver_id = request.args.get("driverId")
        if driver_id:
            query = query.filter(Delivery.driver_id == int(driver_id))

    vehicle_id = request.args.get("vehicleId")
    if vehicle_id and user.role == "admin":
        query = query.filter(Delivery.vehicle_id == int(vehicle_id))

    search = (request.args.get("search") or "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Delivery.tracking_code.ilike(like),
                Delivery.dropoff_address.ilike(like),
                Delivery.pickup_address.ilike(like),
            )
        )

    query = query.order_by(Delivery.date_created.desc())

    limit = request.args.get("limit")
    if limit:
        try:
            query = query.limit(max(1, min(int(limit), 500)))
        except ValueError:
            raise validation_error("limit must be an integer.")

    return jsonify([delivery_to_dict(d) for d in query.all()])


@deliveries_bp.get("/api/deliveries/<int:delivery_id>")
@jwt_required()
def get_delivery(delivery_id: int):
    user = current_user()
    delivery = _load_delivery(delivery_id)
    _assert_can_access(user, delivery)
    return jsonify(delivery_to_dict(delivery))


@deliveries_bp.post("/api/deliveries")
@admin_required
def create_delivery():
    """FR3 — capture a waybill and its line items. Created as Pending."""
    payload = request.get_json(silent=True) or {}

    customer_id = payload.get("customerId")
    customer = db.session.get(Customer, int(customer_id)) if customer_id else None
    if customer is None:
        raise validation_error("Select a valid customer.")

    pickup = str(payload.get("pickupAddress", "")).strip()
    dropoff = str(payload.get("dropoffAddress", "")).strip()
    if len(pickup) < 5 or len(dropoff) < 5:
        raise validation_error("Both pickup and drop-off addresses are required.")

    items = payload.get("items") or []
    if not isinstance(items, list) or len(items) == 0:
        raise validation_error("Add at least one line item.")

    product_ids = []
    for item in items:
        try:
            product_ids.append(int(item.get("productId")))
        except (TypeError, ValueError):
            raise validation_error("Each line item needs a valid product.")

    known = {p.product_id for p in Product.query.filter(Product.product_id.in_(product_ids)).all()}
    missing = [pid for pid in product_ids if pid not in known]
    if missing:
        raise validation_error(f"Unknown product id(s): {missing}.")

    delivery = Delivery(
        customer_id=customer.customer_id,
        # FR3 — the recipient's own details, distinct from the sending customer.
        recipient_name=str(payload.get("recipientName", "")).strip() or None,
        recipient_phone=str(payload.get("recipientPhone", "")).strip() or None,
        pickup_address=pickup,
        dropoff_address=dropoff,
        status="pending",
        tracking_code=generate_tracking_code(),
    )
    db.session.add(delivery)
    db.session.flush()  # assign delivery_id before writing line items

    for item in items:
        try:
            quantity = int(item.get("quantity", 1))
        except (TypeError, ValueError):
            raise validation_error("Quantity must be a whole number.")
        if quantity < 1:
            raise validation_error("Quantity must be at least 1.")
        db.session.add(
            DeliveryItem(
                delivery_id=delivery.delivery_id,
                product_id=int(item["productId"]),
                quantity=quantity,
            )
        )

    # FR9 — notify dispatch that a waybill is waiting for allocation.
    emit(
        category="dispatch",
        severity="info",
        title=f"New order {delivery.tracking_code} awaiting allocation",
        body=f"{customer.name} · {dropoff}",
        link="/dispatch",
    )

    db.session.commit()
    return jsonify(delivery_to_dict(delivery)), 201


@deliveries_bp.post("/api/deliveries/<int:delivery_id>/assign")
@admin_required
def assign_delivery(delivery_id: int):
    """FR4 / FR7 / PRD TC02 & TC03 — atomic allocation with a 409 on conflict."""
    payload = request.get_json(silent=True) or {}

    delivery = _load_delivery(delivery_id)

    try:
        driver_id = int(payload.get("driverId"))
        vehicle_id = int(payload.get("vehicleId"))
    except (TypeError, ValueError):
        raise validation_error("A driver and a vehicle must both be selected.")

    driver = db.session.get(Driver, driver_id)
    if driver is None:
        raise validation_error("Select a valid driver.")

    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise validation_error("Select a valid vehicle.")

    allocate_delivery(delivery, driver, vehicle)

    # FR9 — record the dispatch event (separate transaction; the allocation is already durable).
    emit(
        category="dispatch",
        severity="info",
        title=f"{delivery.tracking_code} dispatched to {driver.full_name}",
        body=f"{vehicle.registration_number} · {delivery.dropoff_address}",
        link="/dispatch",
    )
    db.session.commit()

    return jsonify(delivery_to_dict(delivery))


@deliveries_bp.patch("/api/deliveries/<int:delivery_id>/status")
@jwt_required()
def update_delivery_status(delivery_id: int):
    """FR5 / PRD TC04 — lifecycle transition guarded by the state machine."""
    user = current_user()
    delivery = _load_delivery(delivery_id)
    _assert_can_access(user, delivery)

    payload = request.get_json(silent=True) or {}
    status = str(payload.get("status", "")).strip()
    if status not in DELIVERY_STATUSES:
        raise validation_error("Unknown delivery status.")

    advance_delivery_status(delivery, status)

    # FR9 — surface the lifecycle change.
    if status == "delivered":
        emit(
            category="dispatch",
            severity="success",
            title=f"{delivery.tracking_code} delivered",
            body="The assigned driver and vehicle are available again.",
            link="/dispatch",
        )
    elif status == "cancelled":
        emit(
            category="dispatch",
            severity="warning",
            title=f"{delivery.tracking_code} cancelled",
            body="Any allocated resources were released.",
            link="/dispatch",
        )
    else:
        emit(
            category="dispatch",
            severity="info",
            title=f"{delivery.tracking_code} is now {status.replace('_', ' ')}",
            body="Delivery lifecycle updated.",
            link="/dispatch",
        )
    db.session.commit()

    return jsonify(delivery_to_dict(delivery))
