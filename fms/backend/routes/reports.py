"""Filterable reporting (FR8 output design).

Returns the filtered delivery rows plus the server-computed summary the Reports screen
displays, so the client never has to aggregate a full result set to draw the KPI row.
"""

from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request

from errors import validation_error
from extensions import db
from models import DELIVERY_STATUSES, Delivery, DeliveryItem
from routes.auth import admin_required
from serializers import delivery_to_dict

reports_bp = Blueprint("reports", __name__)


def _parse_iso_date(raw: str | None, field: str) -> date | None:
    if not raw:
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError:
        raise validation_error(f"{field} must be a valid ISO date (YYYY-MM-DD).")


@reports_bp.get("/api/reports")
@admin_required
def report():
    query = Delivery.query

    date_from = _parse_iso_date(request.args.get("from"), "from")
    date_to = _parse_iso_date(request.args.get("to"), "to")

    if date_from is not None:
        query = query.filter(Delivery.date_created >= datetime.combine(date_from, datetime.min.time()))
    if date_to is not None:
        # Inclusive of the whole 'to' day.
        query = query.filter(
            Delivery.date_created < datetime.combine(date_to + timedelta(days=1), datetime.min.time())
        )

    vehicle_id = request.args.get("vehicleId")
    if vehicle_id and vehicle_id != "all":
        try:
            query = query.filter(Delivery.vehicle_id == int(vehicle_id))
        except ValueError:
            raise validation_error("vehicleId must be an integer.")

    driver_id = request.args.get("driverId")
    if driver_id and driver_id != "all":
        try:
            query = query.filter(Delivery.driver_id == int(driver_id))
        except ValueError:
            raise validation_error("driverId must be an integer.")

    status = request.args.get("status")
    if status and status != "all":
        if status not in DELIVERY_STATUSES:
            raise validation_error(f"Unknown delivery status '{status}'.")
        query = query.filter(Delivery.status == status)

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

    rows = query.order_by(Delivery.date_created.desc()).all()

    # ── summary ──────────────────────────────────────────────────────────
    by_status = {s: 0 for s in DELIVERY_STATUSES}
    for delivery in rows:
        by_status[delivery.status] = by_status.get(delivery.status, 0) + 1

    closed = by_status["delivered"] + by_status["cancelled"]
    completion_rate = 0 if closed == 0 else round(by_status["delivered"] / closed * 100)

    delivery_ids = [d.delivery_id for d in rows]
    total_items = 0
    if delivery_ids:
        total_items = int(
            db.session.query(db.func.coalesce(db.func.sum(DeliveryItem.quantity), 0))
            .filter(DeliveryItem.delivery_id.in_(delivery_ids))
            .scalar()
            or 0
        )

    unique_customers = len({d.customer_id for d in rows})

    window_from = date_from or (min((d.date_created.date() for d in rows), default=None))
    window_to = date_to or (max((d.date_created.date() for d in rows), default=None))
    if window_from and window_to:
        span_days = max(1, (window_to - window_from).days + 1)
    else:
        span_days = 1

    return jsonify(
        {
            "rows": [delivery_to_dict(d) for d in rows],
            "summary": {
                "total": len(rows),
                "byStatus": by_status,
                "completionRate": completion_rate,
                "totalItems": total_items,
                "uniqueCustomers": unique_customers,
                "averagePerDay": round(len(rows) / span_days, 1),
                "from": window_from.isoformat() if window_from else "",
                "to": window_to.isoformat() if window_to else "",
            },
        }
    )
