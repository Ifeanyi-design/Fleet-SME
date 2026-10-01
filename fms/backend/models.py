"""SQLAlchemy models — the final 3NF relational schema from PRD Table 3.4.

Every relation, key and constraint below mirrors the normalised design in the report:
CUSTOMER, DRIVER, VEHICLE, DELIVERY, DELIVERY_ITEM, PRODUCT, MAINTENANCE_LOG.
`APP_USER` is added for authentication (NFR2) and is not part of the analysis model.

Integrity is enforced in the database, not just the service layer (NFR4):
unique registration/licence numbers, CHECK-constrained status enumerations, and
foreign keys with explicit delete behaviour.
"""

from datetime import date, datetime

from extensions import db

# ── allowed status values (mirrors the frontend's string-literal unions) ─────

VEHICLE_STATUSES = ("available", "on_delivery", "in_maintenance", "retired")
DRIVER_STATUSES = ("available", "on_delivery", "off_duty")
DELIVERY_STATUSES = ("pending", "in_progress", "delivered", "cancelled")
VEHICLE_TYPES = ("bike", "trike", "van")


class Customer(db.Model):
    __tablename__ = "customer"

    customer_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(32), nullable=False)
    address = db.Column(db.String(200), nullable=False)

    deliveries = db.relationship("Delivery", back_populates="customer", lazy="selectin")


class Driver(db.Model):
    __tablename__ = "driver"

    driver_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    phone_number = db.Column(db.String(32), nullable=False)
    license_number = db.Column(db.String(32), nullable=False, unique=True, index=True)
    license_expiry_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="available")

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('available','on_delivery','off_duty')", name="ck_driver_status"
        ),
    )


class Vehicle(db.Model):
    __tablename__ = "vehicle"

    vehicle_id = db.Column(db.Integer, primary_key=True)
    registration_number = db.Column(db.String(24), nullable=False, unique=True, index=True)
    make = db.Column(db.String(60), nullable=False)
    model = db.Column(db.String(60), nullable=False)
    vehicle_type = db.Column(db.String(12), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="available")
    odometer = db.Column(db.Integer, nullable=False, default=0)

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('available','on_delivery','in_maintenance','retired')",
            name="ck_vehicle_status",
        ),
        db.CheckConstraint("vehicle_type IN ('bike','trike','van')", name="ck_vehicle_type"),
        db.CheckConstraint("odometer >= 0", name="ck_vehicle_odometer"),
    )

    maintenance_logs = db.relationship(
        "MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan"
    )


class Product(db.Model):
    __tablename__ = "product"

    product_id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(60), nullable=False)


class Delivery(db.Model):
    __tablename__ = "delivery"

    delivery_id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(
        db.Integer, db.ForeignKey("customer.customer_id"), nullable=False, index=True
    )
    # Nullable until a dispatcher allocates resources (FR4).
    driver_id = db.Column(db.Integer, db.ForeignKey("driver.driver_id"), nullable=True, index=True)
    vehicle_id = db.Column(
        db.Integer, db.ForeignKey("vehicle.vehicle_id"), nullable=True, index=True
    )
    # FR3 requires the recipient's details, not just their address. The recipient is not a
    # CUSTOMER (the customer is the sender), and the 3NF schema has no recipient entity, so
    # these are attributes of the delivery itself.
    recipient_name = db.Column(db.String(120), nullable=True)
    recipient_phone = db.Column(db.String(32), nullable=True)
    pickup_address = db.Column(db.String(200), nullable=False)
    dropoff_address = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    date_created = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    date_delivered = db.Column(db.DateTime, nullable=True)
    tracking_code = db.Column(db.String(16), nullable=False, unique=True, index=True)

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('pending','in_progress','delivered','cancelled')",
            name="ck_delivery_status",
        ),
    )

    customer = db.relationship("Customer", back_populates="deliveries", lazy="joined")
    driver = db.relationship("Driver", lazy="joined")
    vehicle = db.relationship("Vehicle", lazy="joined")
    items = db.relationship(
        "DeliveryItem", back_populates="delivery", cascade="all, delete-orphan", lazy="selectin"
    )


class DeliveryItem(db.Model):
    """Associative entity resolving the M:N between DELIVERY and PRODUCT."""

    __tablename__ = "delivery_item"

    delivery_id = db.Column(
        db.Integer, db.ForeignKey("delivery.delivery_id"), primary_key=True
    )
    product_id = db.Column(db.Integer, db.ForeignKey("product.product_id"), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    __table_args__ = (db.CheckConstraint("quantity > 0", name="ck_delivery_item_quantity"),)

    delivery = db.relationship("Delivery", back_populates="items")
    product = db.relationship("Product", lazy="joined")


class MaintenanceLog(db.Model):
    __tablename__ = "maintenance_log"

    maintenance_id = db.Column(db.Integer, primary_key=True)
    vehicle_id = db.Column(
        db.Integer, db.ForeignKey("vehicle.vehicle_id"), nullable=False, index=True
    )
    service_date = db.Column(db.Date, nullable=False)
    # FR6 requires the odometer reading at service time. Table 3.4's relation omits it, but
    # the functional requirement is explicit, so it is captured here (nullable for rows
    # recorded before it was added).
    odometer = db.Column(db.Integer, nullable=True)
    description = db.Column(db.String(240), nullable=False)
    cost = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    next_due_date = db.Column(db.Date, nullable=False)

    __table_args__ = (
        db.CheckConstraint("cost >= 0", name="ck_maintenance_cost"),
        db.CheckConstraint("odometer IS NULL OR odometer >= 0", name="ck_maintenance_odometer"),
    )

    vehicle = db.relationship("Vehicle", back_populates="maintenance_logs")


class AppUser(db.Model):
    """Authentication principal (NFR2).

    `driver_id` links a driver login to its DRIVER row so the mobile view can resolve
    the rider's own waybills.
    """

    __tablename__ = "app_user"

    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(12), nullable=False, default="admin")
    driver_id = db.Column(db.Integer, db.ForeignKey("driver.driver_id"), nullable=True)

    __table_args__ = (
        db.CheckConstraint("role IN ('admin','driver')", name="ck_app_user_role"),
    )


#: Notification categories (used for classification/filtering).
NOTIFICATION_CATEGORIES = ("dispatch", "maintenance", "compliance", "fleet")
#: Notification severities (drive colour, not behaviour).
NOTIFICATION_SEVERITIES = ("info", "success", "warning", "error")


class Notification(db.Model):
    """Persistent operational notification.

    Unlike a derived alert, these are stored rows with their own read state, so viewing
    them does not make them disappear — opening the bell is not the same as reading.
    Marking read only stamps `is_read`/`read_at`; nothing is ever deleted.

    `dedupe_key` makes the time-based alerts (service due, licence expiring) idempotent:
    the sync upserts by that key instead of stacking a duplicate every time it runs.
    Event notifications leave it null, so the same event type can legitimately recur.
    """

    __tablename__ = "notification"

    notification_id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(24), nullable=False, index=True)
    severity = db.Column(db.String(12), nullable=False, default="info")
    title = db.Column(db.String(180), nullable=False)
    body = db.Column(db.String(320), nullable=False, default="")
    #: In-app route the notification points at, e.g. /vehicles/4
    link = db.Column(db.String(200), nullable=True)
    #: Idempotency key for time-based alerts; null for event notifications.
    dedupe_key = db.Column(db.String(140), nullable=True, unique=True)
    is_read = db.Column(db.Boolean, nullable=False, default=False, index=True)
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    __table_args__ = (
        db.CheckConstraint(
            "category IN ('dispatch','maintenance','compliance','fleet')",
            name="ck_notification_category",
        ),
        db.CheckConstraint(
            "severity IN ('info','success','warning','error')",
            name="ck_notification_severity",
        ),
    )


__all__ = [
    "Customer",
    "Driver",
    "Vehicle",
    "Product",
    "Delivery",
    "DeliveryItem",
    "MaintenanceLog",
    "AppUser",
    "Notification",
    "VEHICLE_STATUSES",
    "DRIVER_STATUSES",
    "DELIVERY_STATUSES",
    "VEHICLE_TYPES",
    "NOTIFICATION_CATEGORIES",
    "NOTIFICATION_SEVERITIES",
    "date",
]
