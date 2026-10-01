"""Driver / rider registry (FR2) and status changes (FR7)."""

from datetime import date, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from errors import conflict, forbidden, not_found, validation_error
from extensions import db
from models import DRIVER_STATUSES, Driver
from routes.auth import admin_required, current_user
from serializers import driver_to_dict

drivers_bp = Blueprint("drivers", __name__)

EXPIRY_WINDOW_DAYS = 30


def _parse_date(raw, field: str) -> date:
    try:
        return date.fromisoformat(str(raw))
    except (TypeError, ValueError):
        raise validation_error(f"{field} must be a valid ISO date (YYYY-MM-DD).")


@drivers_bp.get("/api/drivers")
@admin_required
def list_drivers():
    query = Driver.query

    status = request.args.get("status")
    if status and status != "all":
        if status not in DRIVER_STATUSES:
            raise validation_error(f"Unknown driver status '{status}'.")
        query = query.filter(Driver.status == status)

    if request.args.get("expiringOnly", "").lower() in {"true", "1", "yes"}:
        cutoff = date.today() + timedelta(days=EXPIRY_WINDOW_DAYS)
        query = query.filter(Driver.license_expiry_date <= cutoff)

    search = (request.args.get("search") or "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(
                Driver.full_name.ilike(like),
                Driver.phone_number.ilike(like),
                Driver.license_number.ilike(like),
            )
        )

    rows = query.order_by(Driver.full_name).all()
    return jsonify([driver_to_dict(d) for d in rows])


@drivers_bp.get("/api/drivers/<int:driver_id>")
@jwt_required()
def get_driver(driver_id: int):
    """Admins may read any driver; a driver may read their own record."""
    user = current_user()
    if user.role != "admin" and user.driver_id != driver_id:
        raise forbidden("You can only view your own record.")

    driver = db.session.get(Driver, driver_id)
    if driver is None:
        raise not_found("Driver not found.")
    return jsonify(driver_to_dict(driver))


@drivers_bp.post("/api/drivers")
@admin_required
def create_driver():
    """FR2 — licence numbers are unique."""
    payload = request.get_json(silent=True) or {}

    full_name = str(payload.get("fullName", "")).strip()
    phone = str(payload.get("phoneNumber", "")).strip()
    licence = str(payload.get("licenseNumber", "")).strip().upper()
    status = str(payload.get("status", "available")).strip()

    if len(full_name) < 2:
        raise validation_error("Full name is required.")
    if len(phone) < 7:
        raise validation_error("A valid phone number is required.")
    if len(licence) < 4:
        raise validation_error("Licence number is required.")
    if status not in DRIVER_STATUSES:
        raise validation_error("Unknown driver status.")

    expiry = _parse_date(payload.get("licenseExpiryDate"), "Licence expiry date")

    duplicate = Driver.query.filter(db.func.upper(Driver.license_number) == licence).first()
    if duplicate is not None:
        raise conflict(f"Licence {licence} is already on file.")

    driver = Driver(
        full_name=full_name,
        phone_number=phone,
        license_number=licence,
        license_expiry_date=expiry,
        status=status,
    )
    db.session.add(driver)
    db.session.commit()
    return jsonify(driver_to_dict(driver)), 201


@drivers_bp.patch("/api/drivers/<int:driver_id>")
@admin_required
def update_driver(driver_id: int):
    """FR2 — update a driver profile; FR7 — operational status change."""
    driver = db.session.get(Driver, driver_id)
    if driver is None:
        raise not_found("Driver not found.")

    payload = request.get_json(silent=True) or {}

    if "fullName" in payload:
        full_name = str(payload["fullName"]).strip()
        if len(full_name) < 2:
            raise validation_error("Full name is required.")
        driver.full_name = full_name

    if "phoneNumber" in payload:
        phone = str(payload["phoneNumber"]).strip()
        if len(phone) < 7:
            raise validation_error("A valid phone number is required.")
        driver.phone_number = phone

    if "licenseNumber" in payload:
        licence = str(payload["licenseNumber"]).strip().upper()
        if len(licence) < 4:
            raise validation_error("Licence number is required.")
        clash = Driver.query.filter(
            db.func.upper(Driver.license_number) == licence, Driver.driver_id != driver_id
        ).first()
        if clash is not None:
            raise conflict(f"Licence {licence} is already on file.")
        driver.license_number = licence

    if "licenseExpiryDate" in payload:
        driver.license_expiry_date = _parse_date(
            payload["licenseExpiryDate"], "Licence expiry date"
        )

    if "status" in payload:
        status = str(payload["status"]).strip()
        if status not in DRIVER_STATUSES:
            raise validation_error("Unknown driver status.")
        driver.status = status

    db.session.commit()
    return jsonify(driver_to_dict(driver))
