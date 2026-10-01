"""Reference data for the delivery order form (FR3)."""

from flask import Blueprint, jsonify, request

from errors import conflict, not_found, validation_error
from extensions import db
from models import Customer, Product
from routes.auth import admin_required
from serializers import customer_to_dict, product_to_dict

reference_bp = Blueprint("reference", __name__)


@reference_bp.get("/api/customers")
@admin_required
def list_customers():
    rows = Customer.query.order_by(Customer.name).all()
    return jsonify([customer_to_dict(c) for c in rows])


@reference_bp.post("/api/customers")
@admin_required
def create_customer():
    """Register a customer (the sending business).

    In this model the CUSTOMER is the sender: their registered address is the default
    pickup point, and each waybill carries its own recipient drop-off address. The PRD's
    3NF schema has no recipient entity, so the recipient is captured per delivery.
    """
    payload = request.get_json(silent=True) or {}

    name = str(payload.get("name", "")).strip()
    phone = str(payload.get("phone", "")).strip()
    address = str(payload.get("address", "")).strip()

    if len(name) < 2:
        raise validation_error("Customer name is required.")
    if len(phone) < 7:
        raise validation_error("A valid phone number is required.")
    if len(address) < 5:
        raise validation_error("The customer's pickup address is required.")

    duplicate = Customer.query.filter(
        db.func.lower(Customer.name) == name.lower(), Customer.phone == phone
    ).first()
    if duplicate is not None:
        raise conflict("A customer with that name and phone number already exists.")

    customer = Customer(name=name, phone=phone, address=address)
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer_to_dict(customer)), 201


@reference_bp.post("/api/customers/import")
@admin_required
def import_customers():
    """Bulk-register customers from a parsed CSV/Excel sheet.

    Validated per row rather than all-or-nothing: good rows are committed and bad ones are
    reported back with their line number, so a single typo in a 200-row sheet does not
    force the whole import to be redone.
    """
    payload = request.get_json(silent=True) or {}
    rows = payload.get("customers")

    if not isinstance(rows, list) or len(rows) == 0:
        raise validation_error("Provide a non-empty list of customers.")
    if len(rows) > 500:
        raise validation_error("Import at most 500 customers at a time.")

    created = 0
    skipped = 0
    errors: list[dict] = []
    seen: set[tuple[str, str]] = set()

    for index, row in enumerate(rows, start=1):
        if not isinstance(row, dict):
            errors.append({"row": index, "message": "Row is not an object."})
            continue

        name = str(row.get("name", "")).strip()
        phone = str(row.get("phone", "")).strip()
        address = str(row.get("address", "")).strip()

        if len(name) < 2:
            errors.append({"row": index, "message": "Customer name is missing."})
            continue
        if len(phone) < 7:
            errors.append({"row": index, "message": "A valid phone number is required."})
            continue
        if len(address) < 5:
            errors.append({"row": index, "message": "A pickup address is required."})
            continue

        key = (name.lower(), phone)
        if key in seen:
            skipped += 1  # duplicated within the file itself
            continue
        seen.add(key)

        exists = Customer.query.filter(
            db.func.lower(Customer.name) == name.lower(), Customer.phone == phone
        ).first()
        if exists is not None:
            skipped += 1
            continue

        db.session.add(Customer(name=name, phone=phone, address=address))
        created += 1

    if created:
        db.session.commit()

    return jsonify(
        {"total": len(rows), "created": created, "skipped": skipped, "errors": errors}
    )


@reference_bp.patch("/api/customers/<int:customer_id>")
@admin_required
def update_customer(customer_id: int):
    customer = db.session.get(Customer, customer_id)
    if customer is None:
        raise not_found("Customer not found.")

    payload = request.get_json(silent=True) or {}

    if "name" in payload:
        name = str(payload["name"]).strip()
        if len(name) < 2:
            raise validation_error("Customer name is required.")
        customer.name = name

    if "phone" in payload:
        phone = str(payload["phone"]).strip()
        if len(phone) < 7:
            raise validation_error("A valid phone number is required.")
        customer.phone = phone

    if "address" in payload:
        address = str(payload["address"]).strip()
        if len(address) < 5:
            raise validation_error("The pickup address is required.")
        customer.address = address

    db.session.commit()
    return jsonify(customer_to_dict(customer))


@reference_bp.get("/api/products")
@admin_required
def list_products():
    rows = Product.query.order_by(Product.product_name).all()
    return jsonify([product_to_dict(p) for p in rows])
