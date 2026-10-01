"""Authentication (NFR2).

Passwords are stored as PBKDF2-SHA256 hashes via Werkzeug's `generate_password_hash`
(the PRD permits bcrypt *or* pbkdf2). Admin-only endpoints are gated by `admin_required`,
which also enforces the role claim — so a driver token cannot reach fleet administration.
"""

from functools import wraps

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash

from extensions import db
from errors import forbidden, unauthorized, validation_error
from models import AppUser, Driver
from serializers import user_to_dict

auth_bp = Blueprint("auth", __name__)


def current_user() -> AppUser:
    """Resolve the AppUser behind the current JWT, or raise 401."""
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        raise unauthorized("Invalid session.")

    user = db.session.get(AppUser, user_id)
    if user is None:
        raise unauthorized("Session no longer valid.")
    return user


def _linked_driver(user: AppUser):
    """The DRIVER row behind a driver login, if any."""
    if user.driver_id is None:
        return None
    return db.session.get(Driver, user.driver_id)


def admin_required(fn):
    """Require a valid token belonging to an administrator."""

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user = current_user()
        if user.role != "admin":
            raise forbidden("Administrator access required.")
        return fn(*args, **kwargs)

    return wrapper


@auth_bp.post("/api/auth/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email or not password:
        raise validation_error("Email and password are required.")

    user = AppUser.query.filter(db.func.lower(AppUser.email) == email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        # Deliberately identical response for unknown user and wrong password.
        raise unauthorized("Invalid email or password.")

    token = create_access_token(
        identity=str(user.user_id),
        additional_claims={"role": user.role},
    )
    return jsonify({"token": token, "user": user_to_dict(user, _linked_driver(user))})


@auth_bp.get("/api/auth/me")
@jwt_required()
def me():
    user = current_user()
    return jsonify(user_to_dict(user, _linked_driver(user)))
