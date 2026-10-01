"""Vehicle asset management (FR1) and operational status changes (FR7)."""

from flask import Blueprint, jsonify, request

from errors import conflict, not_found, validation_error
from extensions import db
from models import VEHICLE_TYPES, VEHICLE_STATUSES, Vehicle
from notifications import emit
from routes.auth import admin_required
from serializers import vehicle_to_dict

vehicles_bp = Blueprint("vehicles", __name__)


def _parse_odometer(raw) -> int:
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise validation_error("Odometer must be a whole number.")
    if value < 0:
        raise validation_error("Odometer cannot be negative.")
    return value


@vehicles_bp.get("/api/vehicles")
@admin_required
def list_vehicles():
    query = Vehicle.query

    status = request.args.get("status")
    if status and status != "all":
        if status not in VEHICLE_STATUSES:
            raise validation_error(f"Unknown vehicle status '{status}'.")
        query = query.filter(Vehicle.status == status)

    vehicle_type = request.args.get("type")
    if vehicle_type and vehicle_type != "all":
        if vehicle_type not in VEHICLE_TYPES:
            raise validation_error(f"Unknown vehicle type '{vehicle_type}'.")
        query = query.filter(Vehicle.vehicle_type == vehicle_type)

    search = (request.args.get("search") or "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Vehicle.registration_number.ilike(like),
                Vehicle.make.ilike(like),
                Vehicle.model.ilike(like),
            )
        )

    rows = query.order_by(Vehicle.registration_number).all()
    return jsonify([vehicle_to_dict(v) for v in rows])


@vehicles_bp.get("/api/vehicles/<int:vehicle_id>")
@admin_required
def get_vehicle(vehicle_id: int):
    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise not_found("Vehicle not found.")
    return jsonify(vehicle_to_dict(vehicle))


@vehicles_bp.post("/api/vehicles")
@admin_required
def create_vehicle():
    """FR1 / PRD TC01 — registration numbers are unique."""
    payload = request.get_json(silent=True) or {}

    registration = str(payload.get("registrationNumber", "")).strip().upper()
    make = str(payload.get("make", "")).strip()
    model = str(payload.get("model", "")).strip()
    vehicle_type = str(payload.get("vehicleType", "")).strip()
    status = str(payload.get("status", "available")).strip()

    if len(registration) < 3:
        raise validation_error("Registration number is required.")
    if not make or not model:
        raise validation_error("Make and model are required.")
    if vehicle_type not in VEHICLE_TYPES:
        raise validation_error("Vehicle type must be bike, trike or van.")
    if status not in VEHICLE_STATUSES:
        raise validation_error("Unknown vehicle status.")

    duplicate = Vehicle.query.filter(
        db.func.upper(Vehicle.registration_number) == registration
    ).first()
    if duplicate is not None:
        raise conflict(f"Vehicle {registration} is already registered.")

    vehicle = Vehicle(
        registration_number=registration,
        make=make,
        model=model,
        vehicle_type=vehicle_type,
        status=status,
        odometer=_parse_odometer(payload.get("odometer", 0)),
    )
    db.session.add(vehicle)
    db.session.commit()
    return jsonify(vehicle_to_dict(vehicle)), 201


@vehicles_bp.patch("/api/vehicles/<int:vehicle_id>")
@admin_required
def update_vehicle(vehicle_id: int):
    """FR1 — modify a vehicle record; FR7 — operational status change."""
    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise not_found("Vehicle not found.")

    payload = request.get_json(silent=True) or {}

    if "registrationNumber" in payload:
        registration = str(payload["registrationNumber"]).strip().upper()
        if len(registration) < 3:
            raise validation_error("Registration number is required.")
        clash = Vehicle.query.filter(
            db.func.upper(Vehicle.registration_number) == registration,
            Vehicle.vehicle_id != vehicle_id,
        ).first()
        if clash is not None:
            raise conflict(f"Vehicle {registration} is already registered.")
        vehicle.registration_number = registration

    if "make" in payload:
        make = str(payload["make"]).strip()
        if not make:
            raise validation_error("Make is required.")
        vehicle.make = make

    if "model" in payload:
        model = str(payload["model"]).strip()
        if not model:
            raise validation_error("Model is required.")
        vehicle.model = model

    if "vehicleType" in payload:
        vehicle_type = str(payload["vehicleType"]).strip()
        if vehicle_type not in VEHICLE_TYPES:
            raise validation_error("Vehicle type must be bike, trike or van.")
        vehicle.vehicle_type = vehicle_type

    if "status" in payload:
        status = str(payload["status"]).strip()
        if status not in VEHICLE_STATUSES:
            raise validation_error("Unknown vehicle status.")

        previous = vehicle.status
        vehicle.status = status

        # FR9 — fleet availability changes are worth surfacing.
        if status == "in_maintenance" and previous != "in_maintenance":
            emit(
                category="fleet",
                severity="warning",
                title=f"{vehicle.registration_number} taken off the road",
                body="Marked In Maintenance — unavailable for dispatch.",
                link=f"/vehicles/{vehicle.vehicle_id}",
            )
        elif previous == "in_maintenance" and status == "available":
            emit(
                category="fleet",
                severity="success",
                title=f"{vehicle.registration_number} back in service",
                body="Marked Available — can be dispatched again.",
                link=f"/vehicles/{vehicle.vehicle_id}",
            )

    if "odometer" in payload:
        vehicle.odometer = _parse_odometer(payload["odometer"])

    db.session.commit()
    return jsonify(vehicle_to_dict(vehicle))
