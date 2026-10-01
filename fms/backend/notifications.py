"""Notification service — emit, materialise time-based alerts, and read state.

Two kinds of notification share one table:

  * **Event** notifications are written the moment something happens (an order is
    created, a waybill is dispatched or completed, a service is logged). Their
    `dedupe_key` is null, because the same kind of event legitimately recurs.

  * **Derived** notifications are materialised from time-based conditions (a service
    falling due, a licence approaching expiry). They carry a `dedupe_key` so
    `sync_derived_notifications()` is idempotent — running it on every poll updates
    nothing rather than stacking duplicates. There is no scheduler in scope, so the
    list endpoint calls the sync; it is cheap and side-effect-free when nothing changed.

Read state is per-row and permanent: marking read stamps `is_read`/`read_at`. Nothing is
ever deleted, so viewing the bell never makes a notification vanish.
"""

from datetime import date, datetime, timedelta

from errors import not_found
from extensions import db
from models import (
    NOTIFICATION_CATEGORIES,
    Driver,
    MaintenanceLog,
    Notification,
    Vehicle,
)

#: How far ahead a service/licence counts as "needs attention".
SERVICE_WINDOW_DAYS = 14
LICENCE_WINDOW_DAYS = 30


def emit(
    category: str,
    severity: str,
    title: str,
    body: str = "",
    link: str | None = None,
    dedupe_key: str | None = None,
) -> Notification | None:
    """Queue a notification. Returns None if `dedupe_key` already exists.

    Does not commit — the caller commits as part of its own transaction, so a failed
    request never leaves a notification behind for an action that did not happen.
    """
    if dedupe_key is not None:
        exists = (
            db.session.query(Notification.notification_id)
            .filter_by(dedupe_key=dedupe_key)
            .first()
        )
        if exists is not None:
            return None

    notification = Notification(
        category=category,
        severity=severity,
        title=title,
        body=body,
        link=link,
        dedupe_key=dedupe_key,
    )
    db.session.add(notification)
    return notification


def sync_derived_notifications() -> int:
    """Materialise service-due and licence-expiry alerts. Idempotent."""
    today = date.today()
    created = 0

    # ── preventive maintenance (Figure 3.14 logic) ───────────────────────
    latest_by_vehicle: dict[int, MaintenanceLog] = {}
    for log in MaintenanceLog.query.all():
        current = latest_by_vehicle.get(log.vehicle_id)
        if current is None or log.service_date > current.service_date:
            latest_by_vehicle[log.vehicle_id] = log

    for vehicle_id, log in latest_by_vehicle.items():
        vehicle = db.session.get(Vehicle, vehicle_id)
        if vehicle is None:
            continue
        if log.next_due_date > today + timedelta(days=SERVICE_WINDOW_DAYS):
            continue

        overdue = log.next_due_date < today
        days = abs((log.next_due_date - today).days)
        created_note = emit(
            category="maintenance",
            severity="error" if overdue else "warning",
            title=f"{vehicle.registration_number} service {'overdue' if overdue else 'due'}",
            body=(
                f"Was due {log.next_due_date.isoformat()} — {days} day(s) late"
                if overdue
                else f"Due {log.next_due_date.isoformat()} — in {days} day(s)"
            ),
            link=f"/vehicles/{vehicle_id}",
            dedupe_key=f"service:{vehicle_id}:{log.next_due_date.isoformat()}",
        )
        if created_note is not None:
            created += 1

    # ── licence compliance (FR2) ─────────────────────────────────────────
    for driver in Driver.query.all():
        days_left = (driver.license_expiry_date - today).days
        if days_left > LICENCE_WINDOW_DAYS:
            continue

        expired = days_left < 0
        created_note = emit(
            category="compliance",
            severity="error" if expired else "warning",
            title=f"{driver.full_name} licence {'expired' if expired else 'expiring'}",
            body=(
                f"Expired {driver.license_expiry_date.isoformat()} — {abs(days_left)} day(s) ago"
                if expired
                else f"Expires {driver.license_expiry_date.isoformat()} — in {days_left} day(s)"
            ),
            link=f"/drivers/{driver.driver_id}",
            dedupe_key=f"licence:{driver.driver_id}:{driver.license_expiry_date.isoformat()}",
        )
        if created_note is not None:
            created += 1

    if created:
        db.session.commit()
    return created


def list_notifications(
    category: str | None = None,
    unread_only: bool = False,
    limit: int = 60,
) -> list[Notification]:
    query = Notification.query
    if category and category != "all":
        query = query.filter(Notification.category == category)
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc(), Notification.notification_id.desc()).limit(limit).all()


def summary() -> dict:
    """Unread counts overall and per category (drives the bell badge)."""
    unread_rows = Notification.query.filter(Notification.is_read.is_(False)).all()
    unread_by_category = {category: 0 for category in NOTIFICATION_CATEGORIES}
    for row in unread_rows:
        unread_by_category[row.category] = unread_by_category.get(row.category, 0) + 1

    return {
        "unread": len(unread_rows),
        "total": Notification.query.count(),
        "unreadByCategory": unread_by_category,
    }


def mark_read(notification_id: int) -> Notification:
    notification = db.session.get(Notification, notification_id)
    if notification is None:
        raise not_found("Notification not found.")
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.session.commit()
    return notification


def mark_all_read(category: str | None = None) -> int:
    """Mark every unread notification read (optionally scoped to one category)."""
    query = Notification.query.filter(Notification.is_read.is_(False))
    if category and category != "all":
        query = query.filter(Notification.category == category)

    rows = query.all()
    now = datetime.utcnow()
    for row in rows:
        row.is_read = True
        row.read_at = now
    if rows:
        db.session.commit()
    return len(rows)
