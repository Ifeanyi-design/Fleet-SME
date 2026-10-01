"""Public customer tracking (FR9 extend) — NO authentication.

Privacy: a tracking code is guessable, so this endpoint returns a deliberately narrowed
projection — status, timestamps, item count and a generalised drop-off area. It never
exposes driver identity, vehicle registration, the full street address, or customer
identity. See the privacy assertions in the project's test runs.
"""

from flask import Blueprint, jsonify

from extensions import db
from models import Delivery

tracking_bp = Blueprint("tracking", __name__)

TRACKING_STEPS = (
    ("pending", "Order received"),
    ("in_progress", "Out for delivery"),
    ("delivered", "Delivered"),
)


def _generalise(address: str) -> str:
    """Reduce a full street address to its general area (last two segments)."""
    parts = [part.strip() for part in address.split(",") if part.strip()]
    return ", ".join(parts[-2:]) if parts else ""


def _build_events(delivery: Delivery) -> list[dict]:
    if delivery.status == "cancelled":
        return [
            {
                "status": "pending",
                "label": "Order received",
                "at": delivery.date_created.isoformat() if delivery.date_created else None,
                "done": True,
            },
            {"status": "cancelled", "label": "Cancelled", "at": None, "done": True},
        ]

    active_index = next(
        (i for i, (status, _) in enumerate(TRACKING_STEPS) if status == delivery.status),
        0,
    )

    events = []
    for index, (status, label) in enumerate(TRACKING_STEPS):
        if status == "pending":
            at = delivery.date_created.isoformat() if delivery.date_created else None
        elif status == "delivered":
            at = delivery.date_delivered.isoformat() if delivery.date_delivered else None
        else:
            at = None
        events.append({"status": status, "label": label, "at": at, "done": index <= active_index})
    return events


@tracking_bp.get("/api/track/<string:code>")
def track(code: str):
    """Look up a waybill. Returns JSON null for an unknown code.

    Null (rather than 404) is intentional: the public page renders a friendly
    "no delivery found" state for null, which is better UX than an error banner.
    """
    needle = code.strip().upper()
    delivery = Delivery.query.filter(db.func.upper(Delivery.tracking_code) == needle).first()
    if delivery is None:
        return jsonify(None)

    item_count = sum(item.quantity for item in delivery.items)

    return jsonify(
        {
            "trackingCode": delivery.tracking_code,
            "status": delivery.status,
            "createdAt": delivery.date_created.isoformat() if delivery.date_created else None,
            "deliveredAt": delivery.date_delivered.isoformat() if delivery.date_delivered else None,
            "dropoffArea": _generalise(delivery.dropoff_address),
            "itemCount": item_count,
            "events": _build_events(delivery),
        }
    )
