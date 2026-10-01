"""Domain services — where the PRD's business rules live.

These are the rules the mock implementation already proved out on the frontend; here they
run inside real database transactions so the guarantees are enforced by the persistence
tier rather than by application hope (NFR4).

Key rules:
  FR4/FR7  allocation validates availability, then commits delivery + driver + vehicle together
  PRD TC03 a rejected allocation must leave *nothing* changed
  PRD TC04 completion stamps DateDelivered and releases both resources
  Figure 3.13  the delivery lifecycle state machine
"""

import secrets
from datetime import datetime

from extensions import db
from errors import driver_unavailable, invalid_state, vehicle_unavailable
from models import Delivery, Driver, Vehicle

#: Legal delivery transitions (PRD Figure 3.13).
ALLOWED_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "pending": ("in_progress", "cancelled"),
    "in_progress": ("delivered", "cancelled"),
    "delivered": (),
    "cancelled": (),
}


def generate_tracking_code() -> str:
    """Human-readable, collision-checked waybill code (e.g. FMS-7K2P9X)."""
    for _ in range(20):
        code = f"FMS-{secrets.token_hex(3).upper()}"
        if not db.session.query(Delivery.delivery_id).filter_by(tracking_code=code).first():
            return code
    raise RuntimeError("Could not allocate a unique tracking code.")


def _release_resources(delivery: Delivery) -> None:
    """Return the allocated driver and vehicle to Available (FR7)."""
    if delivery.driver_id is not None:
        driver = db.session.get(Driver, delivery.driver_id)
        if driver is not None and driver.status == "on_delivery":
            driver.status = "available"

    if delivery.vehicle_id is not None:
        vehicle = db.session.get(Vehicle, delivery.vehicle_id)
        if vehicle is not None and vehicle.status == "on_delivery":
            vehicle.status = "available"


def allocate_delivery(delivery: Delivery, driver: Driver, vehicle: Vehicle) -> Delivery:
    """FR4 + FR7 / PRD TC02 & TC03 — atomic dispatch allocation.

    Every precondition is checked *before* any write. If any check fails the session is
    rolled back, so a rejected allocation cannot leave a half-committed state.
    """
    try:
        if delivery.status != "pending":
            raise invalid_state("Delivery cannot be assigned: it is no longer pending.")

        if driver.status != "available":
            raise driver_unavailable("Selected driver is unavailable.")

        if vehicle.status != "available":
            raise vehicle_unavailable("Vehicle is currently committed to an active dispatch.")

        # ── all preconditions satisfied: commit as one unit ──
        delivery.driver_id = driver.driver_id
        delivery.vehicle_id = vehicle.vehicle_id
        delivery.status = "in_progress"
        driver.status = "on_delivery"
        vehicle.status = "on_delivery"
        db.session.commit()
        return delivery

    except Exception:
        db.session.rollback()
        raise


def advance_delivery_status(delivery: Delivery, next_status: str) -> Delivery:
    """FR5 / PRD TC04 — move a delivery through the lifecycle.

    Completion stamps DateDelivered and releases the driver and vehicle back to Available.
    """
    try:
        if next_status not in ALLOWED_TRANSITIONS.get(delivery.status, ()):
            raise invalid_state(f"Cannot move a {delivery.status} delivery to {next_status}.")

        if next_status == "in_progress" and (
            delivery.driver_id is None or delivery.vehicle_id is None
        ):
            raise invalid_state("Assign a driver and vehicle before starting the trip.")

        delivery.status = next_status

        if next_status == "delivered":
            delivery.date_delivered = datetime.utcnow()
            _release_resources(delivery)

        if next_status == "cancelled":
            _release_resources(delivery)

        db.session.commit()
        return delivery

    except Exception:
        db.session.rollback()
        raise
