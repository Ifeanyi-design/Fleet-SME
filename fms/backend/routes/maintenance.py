"""Preventive maintenance logging (FR6) — PRD TC05."""

from datetime import date

from flask import Blueprint, jsonify, request

from errors import not_found, validation_error
from extensions import db
from models import MaintenanceLog, Vehicle
from notifications import emit
from routes.auth import admin_required
from serializers import maintenance_to_dict

maintenance_bp = Blueprint("maintenance", __name__)


def _parse_date(raw, field: str) -> date:
    try:
        return date.fromisoformat(str(raw))
    except (TypeError, ValueError):
        raise validation_error(f"{field} must be a valid ISO date (YYYY-MM-DD).")


@maintenance_bp.get("/api/maintenance")
@admin_required
def list_maintenance():
    query = MaintenanceLog.query

    vehicle_id = request.args.get("vehicleId")
    if vehicle_id and vehicle_id != "all":
        try:
            query = query.filter(MaintenanceLog.vehicle_id == int(vehicle_id))
        except ValueError:
            raise validation_error("vehicleId must be an integer.")

    search = (request.args.get("search") or "").strip()
    if search:
        like = f"%{search}%"
        query = query.join(MaintenanceLog.vehicle).filter(
            db.or_(
                MaintenanceLog.description.ilike(like),
                Vehicle.registration_number.ilike(like),
                Vehicle.make.ilike(like),
            )
        )

    rows = query.order_by(MaintenanceLog.service_date.desc()).all()
    return jsonify([maintenance_to_dict(log, log.vehicle) for log in rows])


@maintenance_bp.post("/api/maintenance")
@admin_required
def create_maintenance():
    """FR6 / PRD TC05 — log a service event against a vehicle."""
    payload = request.get_json(silent=True) or {}

    try:
        vehicle_id = int(payload.get("vehicleId"))
    except (TypeError, ValueError):
        raise validation_error("Select a vehicle.")

    vehicle = db.session.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise validation_error("Select a valid vehicle.")

    description = str(payload.get("description", "")).strip()
    if len(description) < 3:
        raise validation_error("Describe the work carried out.")

    service_date = _parse_date(payload.get("serviceDate"), "Service date")
    next_due = _parse_date(payload.get("nextDueDate"), "Next service date")
    if next_due < service_date:
        raise validation_error("Next service must fall on or after the service date.")

    try:
        cost = float(payload.get("cost", 0))
    except (TypeError, ValueError):
        raise validation_error("Cost must be a number.")
    if cost < 0:
        raise validation_error("Cost cannot be negative.")

    # FR6 — odometer reading at service time (optional so legacy rows remain valid).
    odometer = payload.get("odometer")
    if odometer is None or odometer == "":
        odometer_value = None
    else:
        try:
            odometer_value = int(odometer)
        except (TypeError, ValueError):
            raise validation_error("Odometer reading must be a whole number.")
        if odometer_value < 0:
            raise validation_error("Odometer reading cannot be negative.")

    log = MaintenanceLog(
        vehicle_id=vehicle.vehicle_id,
        service_date=service_date,
        odometer=odometer_value,
        description=description,
        cost=cost,
        next_due_date=next_due,
    )
    db.session.add(log)

    # FR9 — service events are worth surfacing.
    emit(
        category="maintenance",
        severity="info",
        title=f"Service logged for {vehicle.registration_number}",
        body=f"{description} · next due {next_due.isoformat()}",
        link=f"/vehicles/{vehicle.vehicle_id}",
    )

    db.session.commit()
    return jsonify(maintenance_to_dict(log, vehicle)), 201
