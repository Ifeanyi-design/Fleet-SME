"""Fleet Management System — Flask application entry point.

Run:
    .venv/Scripts/python app.py          # Windows
    .venv/bin/python app.py              # macOS / Linux

The API listens on http://127.0.0.1:5000 and serves the contract in plan.md §1.4.
The Vite dev server proxies /api to this port, so the frontend needs no base-URL change
— only `VITE_USE_MOCK=false` in fms/.env.local.
"""

from flask import Flask, jsonify

from config import Config
from errors import register_error_handlers
from extensions import cors, db, jwt
from routes import register_routes


def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── extensions ───────────────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # ── error contract: always JSON { error, message } ───────────────────
    register_error_handlers(app)

    @jwt.unauthorized_loader
    def _missing_token(reason: str):
        return jsonify({"error": "UNAUTHORIZED", "message": "Authentication required."}), 401

    @jwt.invalid_token_loader
    def _invalid_token(reason: str):
        return jsonify({"error": "UNAUTHORIZED", "message": "Invalid session token."}), 401

    @jwt.expired_token_loader
    def _expired_token(_header, _payload):
        return jsonify({"error": "UNAUTHORIZED", "message": "Session expired. Sign in again."}), 401

    # ── routes ───────────────────────────────────────────────────────────
    register_routes(app)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    # ── schema + seed ────────────────────────────────────────────────────
    # create_all() creates missing *tables*; ensure_schema() tops up columns added
    # after the first release. A production deployment should use migrations
    # (Flask-Migrate / Alembic) instead of either.
    with app.app_context():
        db.create_all()
        ensure_schema(app)

        if app.config.get("AUTO_SEED", True):
            from seed import ensure_accounts, seed_if_empty

            # First run on an empty database: load the Case Organisation A baseline.
            seed_if_empty()
            # Every run: make sure the expected accounts exist. A deployment seeded before
            # an account was introduced would otherwise never receive it — see DEPLOY.md.
            ensure_accounts()

    return app


def ensure_schema(app: Flask) -> None:
    """Add columns introduced after the first release to an existing database.

    `create_all()` only creates missing *tables*, never missing columns, so an existing
    dev database would otherwise have to be deleted and re-seeded. This tops up the
    columns added for FR3 (recipient details) and FR6 (odometer reading).

    This is a development stopgap, not a migration strategy — a real deployment should
    use Alembic.
    """
    from sqlalchemy import inspect, text

    additions: dict[str, list[tuple[str, str]]] = {
        "delivery": [
            ("recipient_name", "VARCHAR(120)"),
            ("recipient_phone", "VARCHAR(32)"),
        ],
        "maintenance_log": [("odometer", "INTEGER")],
    }

    inspector = inspect(db.engine)
    for table, columns in additions.items():
        if not inspector.has_table(table):
            continue
        existing = {column["name"] for column in inspector.get_columns(table)}
        for name, ddl_type in columns:
            if name in existing:
                continue
            db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl_type}"))
            app.logger.info("Schema top-up: added %s.%s", table, name)

            # Rows written before the column existed have no value. Approximate the
            # odometer reading from the vehicle's current reading so FR6's field is not
            # blank on pre-existing records. Only runs on the pass that adds the column.
            if table == "maintenance_log" and name == "odometer":
                db.session.execute(
                    text(
                        "UPDATE maintenance_log SET odometer = COALESCE("
                        "(SELECT v.odometer FROM vehicle v"
                        " WHERE v.vehicle_id = maintenance_log.vehicle_id), 0)"
                        " WHERE odometer IS NULL"
                    )
                )

            # FR3 — waybills captured before recipient details existed get a placeholder
            # so the field is populated rather than blank.
            if table == "delivery" and name == "recipient_name":
                db.session.execute(
                    text(
                        "UPDATE delivery SET recipient_name = 'Recipient',"
                        " recipient_phone = '' WHERE recipient_name IS NULL"
                    )
                )

    db.session.commit()


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
