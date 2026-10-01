"""Blueprint registration."""

from routes.auth import auth_bp
from routes.dashboard import dashboard_bp
from routes.deliveries import deliveries_bp
from routes.drivers import drivers_bp
from routes.maintenance import maintenance_bp
from routes.notifications import notifications_bp
from routes.reference import reference_bp
from routes.reports import reports_bp
from routes.tracking import tracking_bp
from routes.vehicles import vehicles_bp

ALL_BLUEPRINTS = (
    auth_bp,
    vehicles_bp,
    drivers_bp,
    deliveries_bp,
    maintenance_bp,
    reference_bp,
    dashboard_bp,
    reports_bp,
    notifications_bp,
    tracking_bp,
)


def register_routes(app) -> None:
    for blueprint in ALL_BLUEPRINTS:
        app.register_blueprint(blueprint)
