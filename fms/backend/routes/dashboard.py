"""Operational intelligence dashboard (FR8).

Aggregates relational records into the managerial summary the PRD specifies: fleet
availability, driver availability, delivery counts by lifecycle stage, maintenance
spend, a per-day volume trend, and the two preventive alert feeds (service due,
licence expiry) that drive the notification bell.
"""

from datetime import date, datetime, timedelta

from flask import Blueprint, jsonify, request

from errors import validation_error
from extensions import db
from models import DELIVERY_STATUSES, Delivery, Driver, MaintenanceLog, Vehicle
from routes.auth import admin_required
from serializers import vehicle_to_dict, driver_to_dict

dashboard_bp = Blueprint("dashboard", __name__)

RANGE_DAYS = {"7d": 7, "30d": 30, "90d": 90}
SERVICE_ALERT_WINDOW = 14
LICENCE_ALERT_WINDOW = 30


@dashboard_bp.get("/api/dashboard/metrics")
@admin_required
def metrics():
    range_key = request.args.get("range", "30d")
    if range_key not in RANGE_DAYS:
        raise validation_error("range must be one of 7d, 30d, 90d.")

    days = RANGE_DAYS[range_key]
    today = date.today()
    cutoff = datetime.combine(today - timedelta(days=days - 1), datetime.min.time())

    # ── fleet counts ─────────────────────────────────────────────────────
    vehicles = Vehicle.query.all()
    drivers = Driver.query.all()

    # ── deliveries in window ─────────────────────────────────────────────
    in_range = Delivery.query.filter(Delivery.date_created >= cutoff).all()

    by_status = {status: 0 for status in DELIVERY_STATUSES}
    for delivery in in_range:
        by_status[delivery.status] = by_status.get(delivery.status, 0) + 1

    # Per-day trend. Computed in Python: a 90-day window is a few thousand rows at most,
    # and this avoids dialect-specific date functions between SQLite and PostgreSQL.
    buckets: dict[str, int] = {}
    for offset in range(days - 1, -1, -1):
        buckets[(today - timedelta(days=offset)).isoformat()] = 0
    for delivery in in_range:
        key = delivery.date_created.date().isoformat()
        if key in buckets:
            buckets[key] += 1
    delivery_trend = [{"date": key, "count": count} for key, count in buckets.items()]

    # ── preventive maintenance alerts (Figure 3.14 logic) ────────────────
    latest_by_vehicle: dict[int, MaintenanceLog] = {}
    for log in MaintenanceLog.query.all():
        current = latest_by_vehicle.get(log.vehicle_id)
        if current is None or log.service_date > current.service_date:
            latest_by_vehicle[log.vehicle_id] = log

    vehicle_index = {v.vehicle_id: v for v in vehicles}
    service_due_soon = []
    for vehicle_id, log in latest_by_vehicle.items():
        vehicle = vehicle_index.get(vehicle_id)
        if vehicle is None:
            continue
        if log.next_due_date <= today + timedelta(days=SERVICE_ALERT_WINDOW):
            service_due_soon.append(
                {
                    "vehicle": vehicle_to_dict(vehicle),
                    "nextDueDate": log.next_due_date.isoformat(),
                    "overdue": log.next_due_date < today,
                }
            )
    service_due_soon.sort(key=lambda row: row["nextDueDate"])

    # ── licence compliance alerts (FR2) ──────────────────────────────────
    licences = []
    for driver in drivers:
        days_left = (driver.license_expiry_date - today).days
        if days_left <= LICENCE_ALERT_WINDOW:
            licences.append({"driver": driver_to_dict(driver), "daysLeft": days_left})
    licences.sort(key=lambda row: row["daysLeft"])

    maintenance_cost_total = (
        db.session.query(db.func.coalesce(db.func.sum(MaintenanceLog.cost), 0)).scalar() or 0
    )

    # FR8 — asset utilisation: how much of the *operational* fleet is deployed right now.
    # Retired vehicles are excluded because they are not available to be utilised.
    on_delivery = sum(1 for v in vehicles if v.status == "on_delivery")
    operational = sum(1 for v in vehicles if v.status != "retired")
    asset_utilization_rate = round(on_delivery / operational * 100) if operational else 0

    # FR8 — driver availability breakdown by status.
    driver_availability = {
        "available": sum(1 for d in drivers if d.status == "available"),
        "on_delivery": sum(1 for d in drivers if d.status == "on_delivery"),
        "off_duty": sum(1 for d in drivers if d.status == "off_duty"),
    }

    return jsonify(
        {
            "totalVehicles": len(vehicles),
            "vehiclesAvailable": sum(1 for v in vehicles if v.status == "available"),
            "vehiclesOnDelivery": on_delivery,
            "vehiclesInMaintenance": sum(1 for v in vehicles if v.status == "in_maintenance"),
            "assetUtilizationRate": asset_utilization_rate,
            "totalDrivers": len(drivers),
            "driversAvailable": driver_availability["available"],
            "driverAvailability": driver_availability,
            # Table 3.6 asks the dashboard to show driver roster status badges.
            "driverRoster": [
                driver_to_dict(d) for d in sorted(drivers, key=lambda d: d.full_name)
            ],
            "deliveriesByStatus": by_status,
            "maintenanceCostTotal": float(maintenance_cost_total),
            "deliveryTrend": delivery_trend,
            "serviceDueSoon": service_due_soon,
            "licensesExpiringSoon": licences,
        }
    )
