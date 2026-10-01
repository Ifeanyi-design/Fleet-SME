"""Notification endpoints (FR9).

All admin-scoped. Reading the list never marks anything read — that only happens on an
explicit `POST /:id/read` (when the user opens an item) or `POST /read-all`.
"""

from flask import Blueprint, jsonify, request

from errors import validation_error
from models import NOTIFICATION_CATEGORIES
from notifications import (
    list_notifications,
    mark_all_read,
    mark_read,
    summary,
    sync_derived_notifications,
)
from routes.auth import admin_required
from serializers import notification_to_dict

notifications_bp = Blueprint("notifications", __name__)


def _parse_category() -> str | None:
    category = request.args.get("category")
    if category and category != "all" and category not in NOTIFICATION_CATEGORIES:
        raise validation_error(f"Unknown notification category '{category}'.")
    return category


def _parse_limit(default: int = 60) -> int:
    raw = request.args.get("limit")
    if not raw:
        return default
    try:
        return max(1, min(int(raw), 300))
    except ValueError:
        raise validation_error("limit must be an integer.")


@notifications_bp.get("/api/notifications")
@admin_required
def get_notifications():
    """List notifications, newest first.

    Also materialises any newly-due time-based alerts first, so the list is always
    current without needing a background scheduler.
    """
    sync_derived_notifications()

    unread_only = request.args.get("unreadOnly", "").lower() in {"true", "1", "yes"}
    rows = list_notifications(
        category=_parse_category(),
        unread_only=unread_only,
        limit=_parse_limit(),
    )
    return jsonify([notification_to_dict(row) for row in rows])


@notifications_bp.get("/api/notifications/summary")
@admin_required
def get_summary():
    """Unread counts for the bell badge."""
    sync_derived_notifications()
    return jsonify(summary())


@notifications_bp.post("/api/notifications/<int:notification_id>/read")
@admin_required
def read_one(notification_id: int):
    return jsonify(notification_to_dict(mark_read(notification_id)))


@notifications_bp.post("/api/notifications/read-all")
@admin_required
def read_all():
    count = mark_all_read(_parse_category())
    return jsonify({"marked": count, **summary()})
