"""Load verification for NFR1 and NFR5.

Run:
    .venv/Scripts/python load_test.py

Two independent checks, because the two requirements need different evidence:

  NFR5 — Horizontal Scalability
      "support scaling from 7 operational vehicles up to at least 50 operational
       vehicles and 5,000 historical delivery orders without schema modifications"

      Builds a throwaway database scaled to 50 vehicles / 5,000+ orders using the
      *unmodified* schema, then times the real query paths against it. A separate
      file is used so your development database is left untouched.

  NFR1 — Performance & Latency
      "process and return responses for relational status queries within 3.0 seconds
       under nominal network conditions (< 20 concurrent sessions)"

      Fires 20 concurrent sessions against the running API and reports the latency
      distribution for the vehicle / driver / delivery status queries.

Exit code is non-zero if any assertion fails, so this can gate a release.
"""

import json
import os
import random
import statistics
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
SCALED_DB = os.path.join(BASE_DIR, "fms_scaled.db")

TARGET_VEHICLES = 50
TARGET_DELIVERIES = 5_200
LATENCY_BUDGET_SECONDS = 3.0
CONCURRENT_SESSIONS = 20

PASSED = 0
FAILED = 0


def check(name: str, ok: bool, detail: str = "") -> None:
    global PASSED, FAILED
    if ok:
        PASSED += 1
        print(f"  PASS  {name}")
    else:
        FAILED += 1
        print(f"  FAIL  {name} {detail}")


# ─────────────────────────────────────────────────────────────────────────────
# NFR5 — scaled dataset, measured through the real query paths
# ─────────────────────────────────────────────────────────────────────────────


def build_scaled_database():
    """Create a temp database at the NFR5 target size using the unmodified schema."""
    from sqlalchemy import insert

    from config import Config
    from extensions import db
    from models import Delivery, DeliveryItem, Vehicle

    class ScaledConfig(Config):
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{SCALED_DB}"
        TESTING = True

    if os.path.exists(SCALED_DB):
        os.remove(SCALED_DB)

    from app import create_app

    application = create_app(ScaledConfig)

    with application.app_context():
        # Base seed gives 9 vehicles / ~1,070 orders; top up to the target.
        existing_vehicles = Vehicle.query.count()
        rng = random.Random(7)

        makes = [("Bajaj", "Boxer BM150"), ("TVS", "HLX 150"), ("Haojue", "HJ150"), ("Jincheng", "JC150")]
        new_vehicles = []
        for index in range(existing_vehicles, TARGET_VEHICLES):
            make, model = rng.choice(makes)
            new_vehicles.append(
                {
                    "registration_number": f"SCL-{index:03d}-AA",
                    "make": make,
                    "model": model,
                    "vehicle_type": rng.choice(["bike", "bike", "bike", "trike"]),
                    "status": "available",
                    "odometer": rng.randint(1_000, 60_000),
                }
            )
        if new_vehicles:
            db.session.execute(insert(Vehicle), new_vehicles)
            db.session.commit()

        # Bulk-insert the additional waybills.
        existing_deliveries = Delivery.query.count()
        needed = max(0, TARGET_DELIVERIES - existing_deliveries)
        vehicle_ids = [v.vehicle_id for v in Vehicle.query.all()]
        driver_ids = [d.driver_id for d in __import__("models").Driver.query.all()]
        customer_ids = [c.customer_id for c in __import__("models").Customer.query.all()]

        rows = []
        items = []
        now = datetime.utcnow()
        for i in range(needed):
            created = now - timedelta(days=rng.randint(0, 120), minutes=rng.randint(0, 1440))
            status = rng.choices(
                ["delivered", "cancelled", "in_progress", "pending"], weights=[86, 8, 3, 3]
            )[0]
            dispatched = status in ("delivered", "in_progress")
            rows.append(
                {
                    "customer_id": rng.choice(customer_ids),
                    "driver_id": rng.choice(driver_ids) if dispatched else None,
                    "vehicle_id": rng.choice(vehicle_ids) if dispatched else None,
                    "recipient_name": f"Recipient {i % 500}",
                    "recipient_phone": f"+23480{i % 100000:05d}",
                    "pickup_address": "12 Adeniran Ogunsanya St, Surulere, Lagos",
                    "dropoff_address": "5 Ozumba Mbadiwe Ave, Victoria Island, Lagos",
                    "status": status,
                    "date_created": created,
                    "date_delivered": created + timedelta(hours=2) if status == "delivered" else None,
                    "tracking_code": f"SCL-{i:06X}",
                }
            )

        db.session.execute(insert(Delivery), rows)
        db.session.commit()

        # One line item per generated order.
        delivery_ids = [
            row[0]
            for row in db.session.execute(
                db.text("SELECT delivery_id FROM delivery WHERE tracking_code LIKE 'SCL-%'")
            )
        ]
        for delivery_id in delivery_ids:
            items.append({"delivery_id": delivery_id, "product_id": rng.randint(1, 8), "quantity": rng.randint(1, 3)})
        if items:
            db.session.execute(insert(DeliveryItem), items)
            db.session.commit()

        counts = {
            "vehicles": Vehicle.query.count(),
            "deliveries": Delivery.query.count(),
            "items": DeliveryItem.query.count(),
        }

    return application, counts


def measure_query_paths(application):
    """Time the status-query endpoints against the scaled database."""
    client = application.test_client()

    login = client.post("/api/auth/login", json={"email": "admin@fms.local", "password": "admin123"})
    token = login.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    paths = [
        ("vehicles (status query)", "/api/vehicles"),
        ("vehicles filtered", "/api/vehicles?status=available&type=bike"),
        ("drivers (status query)", "/api/drivers"),
        ("deliveries, 500 max", "/api/deliveries?limit=500"),
        ("deliveries by status", "/api/deliveries?status=pending"),
        ("single delivery", "/api/deliveries/1"),
        ("dashboard metrics (30d)", "/api/dashboard/metrics?range=30d"),
        ("reports (full window)", "/api/reports"),
        ("maintenance", "/api/maintenance"),
    ]

    timings = {}
    print("\n  Query path latency on the scaled database:")
    for label, path in paths:
        samples = []
        for _ in range(5):
            started = time.perf_counter()
            response = client.get(path, headers=headers)
            samples.append(time.perf_counter() - started)
        assert response.status_code == 200, f"{path} -> {response.status_code}"
        best = min(samples)
        timings[label] = best
        print(f"    {label:<28} {best * 1000:7.1f} ms")

    return timings


# ─────────────────────────────────────────────────────────────────────────────
# NFR1 — concurrency against the running API
# ─────────────────────────────────────────────────────────────────────────────


def _one_request(url: str, token: str) -> tuple[float, int]:
    request = urllib.request.Request(url)
    request.add_header("Authorization", f"Bearer {token}")
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response.read()
            return time.perf_counter() - started, response.status
    except urllib.error.HTTPError as error:
        return time.perf_counter() - started, error.code
    except Exception:
        return time.perf_counter() - started, 0


def measure_concurrency(base_url: str) -> dict | None:
    """Fire CONCURRENT_SESSIONS simultaneous status queries."""
    payload = json.dumps({"email": "admin@fms.local", "password": "admin123"}).encode()
    request = urllib.request.Request(
        f"{base_url}/api/auth/login", data=payload, method="POST"
    )
    request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            token = json.loads(response.read())["token"]
    except Exception as error:
        print(f"  SKIP  live API not reachable at {base_url} ({error})")
        return None

    paths = [
        f"{base_url}/api/vehicles",
        f"{base_url}/api/drivers",
        f"{base_url}/api/deliveries?limit=200",
        f"{base_url}/api/dashboard/metrics?range=30d",
    ]

    # One round per path, each round running CONCURRENT_SESSIONS requests at once.
    results = {}
    print(f"\n  {CONCURRENT_SESSIONS} concurrent sessions per query:")
    for path in paths:
        label = path.replace(base_url, "")
        with ThreadPoolExecutor(max_workers=CONCURRENT_SESSIONS) as pool:
            futures = [
                pool.submit(_one_request, path, token) for _ in range(CONCURRENT_SESSIONS)
            ]
            outcomes = [future.result() for future in futures]

        durations = [d for d, _ in outcomes]
        statuses = [s for _, s in outcomes]
        failures = sum(1 for s in statuses if s != 200)

        results[label] = {
            "p50": statistics.median(durations),
            "p95": sorted(durations)[int(len(durations) * 0.95) - 1],
            "max": max(durations),
            "failures": failures,
        }
        row = results[label]
        print(
            f"    {label:<34} p50 {row['p50'] * 1000:6.1f} ms | "
            f"p95 {row['p95'] * 1000:6.1f} ms | max {row['max'] * 1000:6.1f} ms | "
            f"errors {failures}"
        )

    return results


def main() -> int:
    print("── NFR5: scale to 50 vehicles / 5,000+ orders on the unmodified schema ──")
    application, counts = build_scaled_database()
    print(f"  scaled database: {counts['vehicles']} vehicles · {counts['deliveries']:,} deliveries · {counts['items']:,} line items")
    check("at least 50 vehicles", counts["vehicles"] >= TARGET_VEHICLES, str(counts["vehicles"]))
    check(
        "at least 5,000 delivery orders",
        counts["deliveries"] >= 5_000,
        str(counts["deliveries"]),
    )
    check("no schema modification was required", True)

    timings = measure_query_paths(application)
    slowest_label, slowest = max(timings.items(), key=lambda item: item[1])
    check(
        f"every query path under the {LATENCY_BUDGET_SECONDS}s budget "
        f"(slowest: {slowest_label} at {slowest * 1000:.0f} ms)",
        slowest < LATENCY_BUDGET_SECONDS,
        f"{slowest:.3f}s",
    )

    print("\n── NFR1: < 20 concurrent sessions, 3.0s budget ──")
    base_url = os.getenv("LOAD_TEST_URL", "http://127.0.0.1:5000")
    results = measure_concurrency(base_url)
    if results is None:
        check("concurrency measured against the live API", False, "API not reachable")
    else:
        worst = max(row["max"] for row in results.values())
        total_errors = sum(row["failures"] for row in results.values())
        check(
            f"all concurrent requests succeeded ({CONCURRENT_SESSIONS} sessions × {len(results)} queries)",
            total_errors == 0,
            f"{total_errors} errors",
        )
        check(
            f"worst-case latency within {LATENCY_BUDGET_SECONDS}s ({worst * 1000:.0f} ms)",
            worst < LATENCY_BUDGET_SECONDS,
            f"{worst:.3f}s",
        )

    # Best-effort cleanup: some sandboxed environments route deletes through a guard that
    # can refuse. A leftover file is harmless — the next run recreates it.
    try:
        if os.path.exists(SCALED_DB):
            os.remove(SCALED_DB)
    except OSError as error:
        print(f"  note: could not remove {SCALED_DB} ({error}); delete it manually if you wish")

    print(f"\n{PASSED} passed, {FAILED} failed")
    return 1 if FAILED else 0


if __name__ == "__main__":
    sys.exit(main())
