"""Seed the database with the Case Organisation A baseline (PRD §3.3.1).

Mirrors `fms/src/data/seed/*` exactly so the API returns the same fleet the frontend
already renders with mock data: seven motorcycles plus a tricycle and a van, seven
riders, six customers, eight products, twelve service logs and ~45 days of waybills.

Dates are relative to the day the seed runs, so licence-expiry and service-due alerts
are always meaningful. A fixed PRNG seed keeps the generated history stable.

Idempotent: `seed_if_empty()` does nothing if users already exist.
"""

import os
import random
from datetime import date, datetime, time, timedelta

from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash

from extensions import db
from models import (
    AppUser,
    Customer,
    Delivery,
    DeliveryItem,
    Driver,
    MaintenanceLog,
    Product,
    Vehicle,
)

TODAY = date.today()
DAYS_BACK = 44

DROP_OFF_AREAS = [
    "5 Ozumba Mbadiwe Ave, Victoria Island, Lagos",
    "31 Bode Thomas St, Surulere, Lagos",
    "9 Kudirat Abiola Way, Oregun, Ikeja, Lagos",
    "17 Adeola Odeku St, Victoria Island, Lagos",
    "2 Falomo Roundabout, Ikoyi, Lagos",
    "64 Ogunlana Drive, Surulere, Lagos",
    "11 Adebayo Adedeji Cres, Ikeja, Lagos",
    "28 Oba Akran Ave, Ikeja, Lagos",
    "6 Idejo St, Victoria Island, Lagos",
    "40 Herbert Macaulay Way, Yaba, Lagos",
]


def _iso(offset_days: int) -> date:
    return TODAY + timedelta(days=offset_days)


def _tracking_code(rng: random.Random) -> str:
    return f"FMS-{''.join(rng.choice('0123456789ABCDEF') for _ in range(6))}"


# ── static baseline ──────────────────────────────────────────────────────────

VEHICLES = [
    # The first record matches PRD test case TC01 verbatim.
    ("IBD-452-XY", "Bajaj", "Boxer BM150", "bike", "available", 12500),
    ("LAG-118-KJ", "Bajaj", "Boxer BM150", "bike", "on_delivery", 24800),
    ("LAG-204-AB", "TVS", "HLX 150", "bike", "available", 18200),
    ("KJA-771-QR", "Jincheng", "JC150", "bike", "in_maintenance", 31500),
    ("LAG-560-MN", "Bajaj", "Pulsar 150", "bike", "available", 9400),
    ("ABJ-330-ZZ", "TVS", "Metro Plus", "bike", "on_delivery", 27600),
    ("LAG-889-TT", "Haojue", "HJ150", "bike", "available", 12300),
    ("LAG-042-VX", "Bajaj", "Maxima Z", "trike", "available", 6800),
    ("LAG-901-LP", "Toyota", "Hiace", "van", "retired", 54200),
]

DRIVERS = [
    # (name, phone, licence, expiry offset, status)
    ("Musa Ibrahim", "+2348038039526", "DL-LAG-4471", 268, "on_delivery"),
    ("Chinedu Okafor", "+2348022447710", "DL-LAG-5512", 124, "available"),
    ("Ayo Bakare", "+2348113096620", "DL-LAG-3398", 402, "available"),
    ("Emeka Nwosu", "+2348055127743", "DL-LAG-6204", 19, "available"),  # expiring soon
    ("Yusuf Bello", "+2348099871234", "DL-KJA-1180", -16, "off_duty"),  # expired
    ("Tunde Adeyemi", "+2347066553312", "DL-LAG-7789", 538, "on_delivery"),
    ("Sani Garba", "+2348144770099", "DL-ABJ-2205", 712, "available"),
]

CUSTOMERS = [
    ("Ada Fashion House", "+2348021114455", "12 Adeniran Ogunsanya St, Surulere, Lagos"),
    ("HealthPlus Pharmacy", "+2348092226611", "45 Awolowo Road, Ikoyi, Lagos"),
    ("Mama Cass Kitchen", "+2347033338877", "7 Allen Avenue, Ikeja, Lagos"),
    ("Jumia Vendor Hub", "+2348145552200", "3 Ligali Ayorinde St, Victoria Island, Lagos"),
    ("Bloom Beauty Store", "+2348067779933", "22 Bode Thomas St, Surulere, Lagos"),
    ("TechMart NG", "+2347018884411", "18 Opebi Road, Ikeja, Lagos"),
]

PRODUCTS = [
    ("Ankara Fabric Bundle", "Apparel"),
    ("Ladies Handbag", "Accessories"),
    ("Phone Charger", "Electronics"),
    ("Packaged Meal (x4)", "Food"),
    ("Antibiotics Pack", "Pharmacy"),
    ("Skincare Set", "Cosmetics"),
    ("Bluetooth Earbuds", "Electronics"),
    ("Sneakers (Pair)", "Footwear"),
]

MAINTENANCE = [
    # (vehicle_index, service offset, description, cost, next-due offset, odometer)
    (0, -42, "Engine Oil & Spark Plug Replacement", 18500, -6, 11200),  # PRD TC05 · overdue
    (1, -30, "Brake pad replacement", 9200, 30, 23100),
    (2, -21, "Chain & sprocket service", 7400, 9, 17400),
    (3, -12, "Clutch plate overhaul", 26500, 48, 30800),
    (4, -60, "Rear tyre replacement", 12800, -30, 8100),  # overdue
    (5, -18, "Carburettor cleaning & tuning", 5600, 12, 26900),
    (6, -9, "General servicing & oil change", 6800, 21, 11900),
    (7, -25, "Rear axle lubrication", 4900, 5, 6200),
    (1, -55, "Engine top overhaul", 42000, 35, 19800),
    (2, -6, "Headlamp & wiring fix", 8100, 54, 18100),
    (3, -48, "Suspension bush replacement", 15200, -18, 29600),  # overdue
    (5, -40, "Speedometer cable replacement", 3600, 50, 24500),
]

#: Recipients used to populate FR3's recipient details on seeded waybills.
RECIPIENTS = [
    ("Ngozi Eze", "+2348031234567"),
    ("Bola Adeleke", "+2348062345678"),
    ("Ibrahim Suleiman", "+2348093456789"),
    ("Funke Akindele", "+2347014567890"),
    ("Chidi Obi", "+2348125678901"),
    ("Aisha Mohammed", "+2348146789012"),
]


#: Administrative accounts provisioned on first boot.
ADMIN_ACCOUNTS = [
    ("Ifeanyi Agada", "manager@fleetsme.com"),
    ("Ngozi Okonkwo", "dispatch@fleetsme.com"),
]

#: Accounts from the first release. Their passwords are published in this repository, so
#: they are retired automatically rather than left active in a deployment.
LEGACY_ACCOUNT_EMAILS = ("admin@fms.local", "driver@fms.local")


def _admin_password() -> str:
    return os.getenv("SEED_ADMIN_PASSWORD", "Fleet@2026")


def _driver_password() -> str:
    return os.getenv("SEED_DRIVER_PASSWORD", "Rider@2026")


def driver_email(full_name: str) -> str:
    """Derive a login address from a rider's name, e.g. Musa Ibrahim -> musa.ibrahim@…"""
    return f"{full_name.strip().lower().replace(' ', '.')}@fleetsme.com"


def ensure_accounts() -> None:
    """Provision any missing accounts. Runs on every boot, not just the first.

    `seed_if_empty()` only fires against a brand-new database, so a deployment seeded
    before an account existed would never receive it — which is exactly what happened on
    Render: the database held the original development logins and no amount of redeploying
    added the real ones.

    This is the idempotent counterpart: it adds whatever is missing, leaves existing
    accounts completely alone (passwords are never reset), and retires the superseded
    development logins. Cheap — a few SELECTs — and safe to repeat on every start.
    """
    admin_password = _admin_password()
    driver_password = _driver_password()

    existing = {email.lower() for (email,) in db.session.query(AppUser.email).all()}
    changed = False

    # 1. retire superseded development accounts
    for email in LEGACY_ACCOUNT_EMAILS:
        if email.lower() not in existing:
            continue
        legacy = AppUser.query.filter(db.func.lower(AppUser.email) == email).first()
        if legacy is not None:
            db.session.delete(legacy)
            existing.discard(email.lower())
            changed = True
            print(f"[accounts] retired superseded account {email}")

    # 2. administrators
    for name, email in ADMIN_ACCOUNTS:
        if email.lower() in existing:
            continue
        db.session.add(
            AppUser(
                name=name,
                email=email,
                password_hash=generate_password_hash(admin_password, method="pbkdf2:sha256"),
                role="admin",
            )
        )
        existing.add(email.lower())
        changed = True
        print(f"[accounts] provisioned admin {email}")

    # 3. one login per rider on the roster
    for driver in Driver.query.all():
        email = driver_email(driver.full_name)
        if email in existing:
            continue
        db.session.add(
            AppUser(
                name=driver.full_name,
                email=email,
                password_hash=generate_password_hash(driver_password, method="pbkdf2:sha256"),
                role="driver",
                driver_id=driver.driver_id,
            )
        )
        existing.add(email)
        changed = True
        print(f"[accounts] provisioned driver {email}")

    if changed:
        db.session.commit()


def seed_all() -> None:
    """Populate the database. Assumes empty tables."""
    rng = random.Random(20261001)

    # ── reference data ───────────────────────────────────────────────────
    customers = [
        Customer(name=name, phone=phone, address=address)
        for name, phone, address in CUSTOMERS
    ]
    products = [Product(product_name=name, category=cat) for name, cat in PRODUCTS]
    db.session.add_all(customers + products)

    vehicles = [
        Vehicle(
            registration_number=reg,
            make=make,
            model=model,
            vehicle_type=vtype,
            status=status,
            odometer=odometer,
        )
        for reg, make, model, vtype, status, odometer in VEHICLES
    ]
    drivers = [
        Driver(
            full_name=name,
            phone_number=phone,
            license_number=licence,
            license_expiry_date=_iso(expiry_offset),
            status=status,
        )
        for name, phone, licence, expiry_offset, status in DRIVERS
    ]
    db.session.add_all(vehicles + drivers)
    db.session.flush()  # assign primary keys before referencing them

    # ── maintenance history (FR6) ────────────────────────────────────────
    for vehicle_index, service_offset, description, cost, due_offset, odometer in MAINTENANCE:
        db.session.add(
            MaintenanceLog(
                vehicle_id=vehicles[vehicle_index].vehicle_id,
                service_date=_iso(service_offset),
                odometer=odometer,
                description=description,
                cost=cost,
                next_due_date=_iso(due_offset),
            )
        )

    # ── delivery history (FR3) ───────────────────────────────────────────
    dispatched_driver_ids = [1, 2, 3, 4, 6, 7]
    dispatched_vehicle_ids = [1, 2, 3, 5, 6, 7, 8]
    used_codes: set[str] = set()

    for day_offset in range(-DAYS_BACK, 1):
        is_today = day_offset == 0
        volume = rng.randint(16, 24) if is_today else rng.randint(18, 30)

        for _ in range(volume):
            customer = rng.choice(customers)
            hour = rng.randint(7, 19)
            minute = rng.randint(0, 59)
            created = datetime.combine(_iso(day_offset), time(hour, minute))

            if is_today:
                roll = rng.random()
                status = "pending" if roll < 0.30 else ("in_progress" if roll < 0.55 else "delivered")
            else:
                status = "cancelled" if rng.random() < 0.08 else "delivered"

            dispatched = status in ("in_progress", "delivered")
            driver_id = rng.choice(dispatched_driver_ids) if dispatched else None
            vehicle_id = rng.choice(dispatched_vehicle_ids) if dispatched else None

            code = _tracking_code(rng)
            while code in used_codes:
                code = _tracking_code(rng)
            used_codes.add(code)

            recipient = rng.choice(RECIPIENTS)

            delivery = Delivery(
                customer_id=customer.customer_id,
                driver_id=driver_id,
                vehicle_id=vehicle_id,
                # FR3 — recipient details, distinct from the sending customer.
                recipient_name=recipient[0],
                recipient_phone=recipient[1],
                pickup_address=customer.address,
                dropoff_address=rng.choice(DROP_OFF_AREAS),
                status=status,
                date_created=created,
                date_delivered=created + timedelta(hours=1) if status == "delivered" else None,
                tracking_code=code,
            )
            db.session.add(delivery)
            db.session.flush()

            for product in rng.sample(products, rng.randint(1, 3)):
                db.session.add(
                    DeliveryItem(
                        delivery_id=delivery.delivery_id,
                        product_id=product.product_id,
                        quantity=rng.randint(1, 4),
                    )
                )

    # ── authentication principals (NFR2) ─────────────────────────────────
    # Two administrative accounts plus one login per rider on the roster.
    # Passwords come from the environment so a deployment does not have to ship the
    # development defaults — see DEPLOY.md.
    admin_password = _admin_password()
    driver_password = _driver_password()

    accounts = [
        AppUser(
            name=name,
            email=email,
            password_hash=generate_password_hash(admin_password, method="pbkdf2:sha256"),
            role="admin",
        )
        for name, email in ADMIN_ACCOUNTS
    ]

    for driver in drivers:
        accounts.append(
            AppUser(
                name=driver.full_name,
                email=driver_email(driver.full_name),
                password_hash=generate_password_hash(driver_password, method="pbkdf2:sha256"),
                role="driver",
                driver_id=driver.driver_id,
            )
        )

    db.session.add_all(accounts)

    db.session.commit()

    print(
        f"[seed] {len(vehicles)} vehicles · {len(drivers)} drivers · "
        f"{len(customers)} customers · {len(products)} products · "
        f"{len(MAINTENANCE)} service logs · deliveries across {DAYS_BACK + 1} days"
    )
    print("[seed] accounts provisioned:")
    for account in accounts:
        password = admin_password if account.role == "admin" else driver_password
        print(f"         {account.role:<6} {account.email:<32} {password}")


def seed_if_empty() -> None:
    """Seed only when the database has no users yet.

    Safe to call from every worker process at boot: gunicorn starts several workers,
    and if two of them race to seed the same empty database the loser hits a unique
    constraint, rolls back, and carries on instead of crashing the service.
    """
    try:
        if db.session.query(AppUser.user_id).first() is not None:
            return
        seed_all()
    except IntegrityError:
        db.session.rollback()
        print("[seed] another worker seeded first; skipping")


if __name__ == "__main__":
    from app import create_app

    application = create_app()
    with application.app_context():
        seed_all()
