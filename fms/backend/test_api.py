"""API test suite — PRD Table 4.4 (Formal System Verification Test Suite).

Run:
    .venv/Scripts/python test_api.py

Uses Flask's test client against an in-memory SQLite database seeded with the
Case Organisation A baseline, so it needs no running server and touches no real data.

Covers:
    TC01 register vehicle (and the duplicate-registration constraint)
    TC02 valid dispatch assignment (atomic state change)
    TC03 resource-conflict prevention (negative test)
    TC04 delivery lifecycle completion (resource release)
    TC05 preventive maintenance log creation
    +    the state machine, auth/authz boundaries, driver scoping and tracking privacy
"""

import sys

from config import TestConfig
from extensions import db
from models import AppUser, Delivery, Driver, Vehicle
from seed import seed_all

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


def make_app():
    from app import create_app

    application = create_app(TestConfig)
    with application.app_context():
        db.drop_all()
        db.create_all()
        seed_all()
    return application


def main() -> int:
    app = make_app()
    client = app.test_client()

    print("── auth (NFR2) ──")
    r = client.post("/api/auth/login", json={"email": "manager@fleetsme.com", "password": "Fleet@2026"})
    check("admin login returns a token", r.status_code == 200 and "token" in r.get_json())
    admin = r.get_json()["token"]
    admin_h = {"Authorization": f"Bearer {admin}"}

    r = client.post("/api/auth/login", json={"email": "musa.ibrahim@fleetsme.com", "password": "Rider@2026"})
    check("driver login returns a token", r.status_code == 200)
    driver = r.get_json()["token"]
    driver_h = {"Authorization": f"Bearer {driver}"}

    r = client.post("/api/auth/login", json={"email": "manager@fleetsme.com", "password": "wrong"})
    check("bad password rejected with 401 UNAUTHORIZED", r.status_code == 401 and r.get_json()["error"] == "UNAUTHORIZED")

    check("no token is rejected", client.get("/api/vehicles").status_code == 401)
    r = client.get("/api/vehicles", headers=driver_h)
    check("driver token cannot reach fleet admin (403)", r.status_code == 403 and r.get_json()["error"] == "FORBIDDEN")

    print("── TC01: register vehicle asset ──")
    payload = {
        "registrationNumber": "lag-777-new",
        "make": "Bajaj",
        "model": "Boxer BM150",
        "vehicleType": "bike",
        "odometer": 0,
        "status": "available",
    }
    r = client.post("/api/vehicles", json=payload, headers=admin_h)
    check("vehicle created (201)", r.status_code == 201, str(r.status_code))
    created = r.get_json()
    check("registration normalised to upper case", created.get("registrationNumber") == "LAG-777-NEW")
    check("status initialised to Available", created.get("status") == "available")

    r = client.post("/api/vehicles", json={**payload, "registrationNumber": "IBD-452-XY"}, headers=admin_h)
    check("duplicate registration rejected (409 CONFLICT)", r.status_code == 409 and r.get_json()["error"] == "CONFLICT")

    r = client.get("/api/vehicles", headers=admin_h)
    check("vehicle list renders", r.status_code == 200 and len(r.get_json()) == 10)

    print("── TC05: preventive maintenance log ──")
    r = client.post(
        "/api/maintenance",
        json={
            "vehicleId": 1,
            "serviceDate": "2026-10-15",
            "description": "Engine Oil & Spark Plug Replacement",
            "cost": 18500,
            "nextDueDate": "2027-01-15",
        },
        headers=admin_h,
    )
    check("maintenance log committed (201)", r.status_code == 201, str(r.status_code))
    log = r.get_json()
    check("log linked to the vehicle", log.get("vehicleId") == 1)
    check("vehicle embedded in the response", isinstance(log.get("vehicle"), dict))

    r = client.post(
        "/api/maintenance",
        json={"vehicleId": 9999, "serviceDate": "2026-10-15", "description": "x", "cost": 1, "nextDueDate": "2026-11-15"},
        headers=admin_h,
    )
    check("unknown vehicle rejected (422)", r.status_code == 422)

    r = client.post(
        "/api/maintenance",
        json={"vehicleId": 1, "serviceDate": "2026-10-15", "description": "x", "cost": 1, "nextDueDate": "2026-01-01"},
        headers=admin_h,
    )
    check("next-due before service date rejected (422)", r.status_code == 422)

    print("── FR3: delivery order intake ──")
    r = client.post(
        "/api/deliveries",
        json={
            "customerId": 1,
            "pickupAddress": "12 Adeniran Ogunsanya St, Surulere, Lagos",
            "dropoffAddress": "5 Ozumba Mbadiwe Ave, Victoria Island, Lagos",
            "items": [{"productId": 1, "quantity": 2}, {"productId": 3, "quantity": 1}],
        },
        headers=admin_h,
    )
    check("order created (201)", r.status_code == 201, str(r.status_code))
    order = r.get_json()
    check("order starts Pending", order.get("status") == "pending")
    check("order holds no resources yet", order.get("driverId") is None and order.get("vehicleId") is None)
    check("tracking code generated", str(order.get("trackingCode", "")).startswith("FMS-"))
    check("line items persisted", len(order.get("items", [])) == 2)
    order_id = order["deliveryId"]

    r = client.post(
        "/api/deliveries",
        json={"customerId": 1, "pickupAddress": "aaaaa", "dropoffAddress": "bbbbb", "items": []},
        headers=admin_h,
    )
    check("order with no line items rejected (422)", r.status_code == 422)

    print("── TC02: valid dispatch assignment (atomic) ──")
    vehicles = client.get("/api/vehicles?status=available", headers=admin_h).get_json()
    drivers = client.get("/api/drivers?status=available", headers=admin_h).get_json()
    vehicle_id = vehicles[0]["vehicleId"]
    driver_id = drivers[0]["driverId"]

    r = client.post(
        f"/api/deliveries/{order_id}/assign",
        json={"driverId": driver_id, "vehicleId": vehicle_id},
        headers=admin_h,
    )
    check("assignment accepted (200)", r.status_code == 200, str(r.status_code))
    assigned = r.get_json()
    check("delivery -> In Progress", assigned.get("status") == "in_progress")
    check("delivery holds the allocated resources", assigned.get("driverId") == driver_id and assigned.get("vehicleId") == vehicle_id)

    v_after = client.get(f"/api/vehicles/{vehicle_id}", headers=admin_h).get_json()
    d_after = client.get(f"/api/drivers/{driver_id}", headers=admin_h).get_json()
    check("vehicle -> On Delivery", v_after["status"] == "on_delivery", v_after["status"])
    check("driver -> On Delivery", d_after["status"] == "on_delivery", d_after["status"])

    print("── TC03: resource-conflict prevention (negative) ──")
    r = client.post(
        "/api/deliveries",
        json={
            "customerId": 2,
            "pickupAddress": "45 Awolowo Road, Ikoyi, Lagos",
            "dropoffAddress": "9 Kudirat Abiola Way, Oregun, Ikeja, Lagos",
            "items": [{"productId": 4, "quantity": 1}],
        },
        headers=admin_h,
    )
    order2_id = r.get_json()["deliveryId"]

    other_driver = next(d for d in drivers if d["driverId"] != driver_id)
    other_vehicle = next(v for v in vehicles if v["vehicleId"] != vehicle_id)

    r = client.post(
        f"/api/deliveries/{order2_id}/assign",
        json={"driverId": other_driver["driverId"], "vehicleId": vehicle_id},
        headers=admin_h,
    )
    check("busy vehicle rejected (409 VEHICLE_UNAVAILABLE)", r.status_code == 409 and r.get_json()["error"] == "VEHICLE_UNAVAILABLE", r.get_json().get("error", ""))

    r = client.post(
        f"/api/deliveries/{order2_id}/assign",
        json={"driverId": driver_id, "vehicleId": other_vehicle["vehicleId"]},
        headers=admin_h,
    )
    check("busy driver rejected (409 DRIVER_UNAVAILABLE)", r.status_code == 409 and r.get_json()["error"] == "DRIVER_UNAVAILABLE", r.get_json().get("error", ""))

    still_pending = client.get(f"/api/deliveries/{order2_id}", headers=admin_h).get_json()
    check("rejected assignment left the order Pending (rolled back)", still_pending["status"] == "pending")
    v_unchanged = client.get(f"/api/vehicles/{vehicle_id}", headers=admin_h).get_json()
    check("rejected assignment did not alter the vehicle", v_unchanged["status"] == "on_delivery")

    print("── state machine ──")
    r = client.patch(f"/api/deliveries/{order2_id}/status", json={"status": "delivered"}, headers=admin_h)
    check("Pending -> Delivered rejected (409 INVALID_STATE)", r.status_code == 409 and r.get_json()["error"] == "INVALID_STATE")

    print("── TC04: delivery lifecycle completion ──")
    r = client.patch(f"/api/deliveries/{order_id}/status", json={"status": "delivered"}, headers=admin_h)
    check("completion accepted (200)", r.status_code == 200, str(r.status_code))
    completed = r.get_json()
    check("delivery -> Delivered", completed["status"] == "delivered")
    check("dateDelivered stamped", isinstance(completed.get("dateDelivered"), str))

    v_released = client.get(f"/api/vehicles/{vehicle_id}", headers=admin_h).get_json()
    d_released = client.get(f"/api/drivers/{driver_id}", headers=admin_h).get_json()
    check("vehicle released -> Available", v_released["status"] == "available", v_released["status"])
    check("driver released -> Available", d_released["status"] == "available", d_released["status"])

    r = client.patch(f"/api/deliveries/{order_id}/status", json={"status": "in_progress"}, headers=admin_h)
    check("Delivered is terminal (409)", r.status_code == 409)

    print("── driver scoping ──")
    r = client.get("/api/deliveries", headers=driver_h)
    check("driver can list their own waybills", r.status_code == 200)
    rows = r.get_json()
    driver_row = client.get("/api/auth/me", headers=driver_h).get_json()
    own_driver_id = 1  # seeded link for musa.ibrahim@fleetsme.com
    check("driver sees only their own waybills", all(row["driverId"] == own_driver_id for row in rows), f"role={driver_row.get('role')}")
    check("driver cannot override the driverId filter", client.get("/api/deliveries?driverId=6", headers=driver_h).get_json() == rows or all(r["driverId"] == own_driver_id for r in client.get("/api/deliveries?driverId=6", headers=driver_h).get_json()))

    print("── FR8: dashboard + reports ──")
    m = client.get("/api/dashboard/metrics?range=30d", headers=admin_h).get_json()
    check("dashboard returns fleet counts", m["totalVehicles"] >= 10 and m["totalDrivers"] == 7)
    check("delivery trend has 30 points", len(m["deliveryTrend"]) == 30, str(len(m["deliveryTrend"])))
    check("service alerts present", len(m["serviceDueSoon"]) >= 1)
    check("licence alerts present", len(m["licensesExpiringSoon"]) >= 2)

    rep = client.get("/api/reports", headers=admin_h).get_json()
    status_sum = sum(rep["summary"]["byStatus"].values())
    check("report summary total equals rows", rep["summary"]["total"] == len(rep["rows"]))
    check("byStatus sums to the total", status_sum == rep["summary"]["total"])
    check("completion rate is a percentage", 0 <= rep["summary"]["completionRate"] <= 100)

    rep_status = client.get("/api/reports?status=delivered", headers=admin_h).get_json()
    check("report status filter applies", all(row["status"] == "delivered" for row in rep_status["rows"]))

    print("── FR9: public tracking (privacy) ──")
    code = rep["rows"][0]["trackingCode"]
    r = client.get(f"/api/track/{code}")
    check("tracking reachable without a token", r.status_code == 200)
    t = r.get_json()
    check("code echoed back", t["trackingCode"] == code)
    check("events returned", len(t["events"]) >= 2)
    for leaked in ("driver", "driverId", "vehicle", "vehicleId", "pickupAddress", "dropoffAddress", "customer", "customerId"):
        check(f"does NOT expose {leaked}", leaked not in t)
    check("drop-off area is generalised (no street number)", not t["dropoffArea"][:1].isdigit(), t["dropoffArea"])

    r = client.get("/api/track/FMS-NOPE99")
    check("unknown code returns null", r.status_code == 200 and r.get_json() is None)

    lower = client.get(f"/api/track/{code.lower()}")
    check("lookup is case-insensitive", lower.get_json() is not None)

    # The tracking page resolves a code the customer already holds; there is no public
    # endpoint that lists codes, by design.
    r = client.get("/api/track/examples")
    check("no public endpoint enumerates tracking codes", r.status_code == 404)

    print("── shared state across sessions (admin ⇄ driver) ──")
    # The point of the database: an action taken in one session must be visible in
    # the other, because both read and write the same rows.

    me_driver = client.get("/api/auth/me", headers=driver_h).get_json()
    linked_driver_id = me_driver.get("driverId")
    check("driver principal carries driverId", linked_driver_id == 1, str(linked_driver_id))
    check("driver principal embeds the driver record", isinstance(me_driver.get("driver"), dict))
    check("admin principal has no driverId", client.get("/api/auth/me", headers=admin_h).get_json()["driverId"] is None)

    r = client.post(
        "/api/deliveries",
        json={
            "customerId": 3,
            "pickupAddress": "7 Allen Avenue, Ikeja, Lagos",
            "dropoffAddress": "6 Idejo St, Victoria Island, Lagos",
            "items": [{"productId": 6, "quantity": 1}],
        },
        headers=admin_h,
    )
    shared_id = r.get_json()["deliveryId"]

    available = client.get("/api/vehicles?status=available", headers=admin_h).get_json()
    shared_vehicle = available[0]["vehicleId"]

    # The seeded rider starts mid-delivery (the baseline models a live fleet), so free
    # him first — exactly what a dispatcher does when a rider finishes a run.
    client.patch(
        f"/api/drivers/{linked_driver_id}", json={"status": "available"}, headers=admin_h
    )

    r = client.post(
        f"/api/deliveries/{shared_id}/assign",
        json={"driverId": linked_driver_id, "vehicleId": shared_vehicle},
        headers=admin_h,
    )
    check("admin allocated a waybill to the driver", r.status_code == 200, str(r.status_code))
    check(
        "allocation moved the driver to On Delivery",
        client.get(f"/api/drivers/{linked_driver_id}", headers=admin_h).get_json()["status"]
        == "on_delivery",
    )

    driver_rows = client.get("/api/deliveries", headers=driver_h).get_json()
    check(
        "driver session immediately sees the admin's assignment",
        any(row["deliveryId"] == shared_id for row in driver_rows),
    )

    r = client.patch(
        f"/api/deliveries/{shared_id}/status", json={"status": "delivered"}, headers=driver_h
    )
    check("driver can complete their own waybill", r.status_code == 200, str(r.status_code))

    v_after_driver = client.get(f"/api/vehicles/{shared_vehicle}", headers=admin_h).get_json()
    check(
        "admin sees the vehicle the driver released",
        v_after_driver["status"] == "available",
        v_after_driver["status"],
    )
    admin_view = client.get(f"/api/deliveries/{shared_id}", headers=admin_h).get_json()
    check("admin sees the delivery the driver completed", admin_view["status"] == "delivered")

    # A driver must not be able to touch another rider's work.
    others = [
        row
        for row in client.get("/api/deliveries", headers=admin_h).get_json()
        if row["driverId"] not in (None, linked_driver_id) and row["status"] == "delivered"
    ]
    if others:
        r = client.patch(
            f"/api/deliveries/{others[0]['deliveryId']}/status",
            json={"status": "cancelled"},
            headers=driver_h,
        )
        check("driver cannot advance another rider's waybill (403)", r.status_code == 403, str(r.status_code))

    # A driver may read their own record but not someone else's.
    check(
        "driver can read their own driver record",
        client.get(f"/api/drivers/{linked_driver_id}", headers=driver_h).status_code == 200,
    )
    check(
        "driver cannot read another driver's record (403)",
        client.get("/api/drivers/6", headers=driver_h).status_code == 403,
    )

    print("── FR9: notifications ──")
    client.post("/api/notifications/read-all", headers=admin_h)  # start from a clean slate

    summary = client.get("/api/notifications/summary", headers=admin_h).get_json()
    check("summary returns unread counts", "unread" in summary and "unreadByCategory" in summary)
    check(
        "derived alerts were materialised from the seed",
        summary["unread"] >= 1,
        str(summary["unread"]),
    )
    check(
        "unread counts split by category",
        sum(summary["unreadByCategory"].values()) == summary["unread"],
    )

    first = client.get("/api/notifications", headers=admin_h).get_json()
    check("notification list renders", len(first) >= 1)
    check(
        "notifications are newest-first",
        all(
            first[i - 1]["createdAt"] >= first[i]["createdAt"] for i in range(1, len(first))
        ),
    )
    check("each notification carries a category", all(n["category"] for n in first))

    # Idempotency: the derived sync must not stack duplicates.
    again = client.get("/api/notifications", headers=admin_h).get_json()
    check("derived sync is idempotent (no duplicates)", len(again) == len(first), f"{len(again)} vs {len(first)}")

    # An event notification should appear when something actually happens.
    before = len(again)
    client.post(
        "/api/deliveries",
        json={
            "customerId": 2,
            "pickupAddress": "45 Awolowo Road, Ikoyi, Lagos",
            "dropoffAddress": "28 Oba Akran Ave, Ikeja, Lagos",
            "items": [{"productId": 2, "quantity": 1}],
        },
        headers=admin_h,
    )
    after = client.get("/api/notifications", headers=admin_h).get_json()
    check("creating an order raises a notification", len(after) == before + 1, f"{len(after)} vs {before}")
    check("the new notification is a dispatch event", after[0]["category"] == "dispatch")

    # Marking one read must NOT delete it.
    target = after[0]
    r = client.post(f"/api/notifications/{target['notificationId']}/read", headers=admin_h)
    check("mark-one-read returns the row", r.status_code == 200 and r.get_json()["isRead"] is True)

    listed = client.get("/api/notifications", headers=admin_h).get_json()
    check("read notifications are retained, not removed", len(listed) == len(after))
    check(
        "the read one is still present and flagged read",
        any(n["notificationId"] == target["notificationId"] and n["isRead"] for n in listed),
    )

    unread_only = client.get("/api/notifications?unreadOnly=true", headers=admin_h).get_json()
    check("unreadOnly filter excludes read rows", all(not n["isRead"] for n in unread_only))
    check("unreadOnly returns fewer rows", len(unread_only) < len(listed))

    compliance = client.get("/api/notifications?category=compliance", headers=admin_h).get_json()
    check("category filter applies", all(n["category"] == "compliance" for n in compliance))

    result = client.post("/api/notifications/read-all", headers=admin_h).get_json()
    check("mark-all-read reports a count", result["marked"] >= 1)
    check("nothing is unread afterwards", result["unread"] == 0)
    check(
        "mark-all does not delete anything",
        len(client.get("/api/notifications", headers=admin_h).get_json()) == len(listed),
    )

    print("── FR3: customer management ──")
    r = client.post(
        "/api/customers",
        json={
            "name": "Lagos Threads Ltd",
            "phone": "+2348091112233",
            "address": "14 Ogunlana Drive, Surulere, Lagos",
        },
        headers=admin_h,
    )
    check("customer created (201)", r.status_code == 201, str(r.status_code))
    new_customer = r.get_json()
    check("customer returned with an id", isinstance(new_customer.get("customerId"), int))

    r = client.post(
        "/api/customers",
        json={
            "name": "Lagos Threads Ltd",
            "phone": "+2348091112233",
            "address": "14 Ogunlana Drive, Surulere, Lagos",
        },
        headers=admin_h,
    )
    check("duplicate customer rejected (409)", r.status_code == 409)

    r = client.post("/api/customers", json={"name": "X", "phone": "1", "address": "y"}, headers=admin_h)
    check("invalid customer rejected (422)", r.status_code == 422)

    # The new customer can immediately be used on a waybill.
    r = client.post(
        "/api/deliveries",
        json={
            "customerId": new_customer["customerId"],
            "pickupAddress": new_customer["address"],
            "dropoffAddress": "6 Idejo St, Victoria Island, Lagos",
            "items": [{"productId": 1, "quantity": 1}],
        },
        headers=admin_h,
    )
    check("new customer can be used on an order", r.status_code == 201, str(r.status_code))

    print("── FR3: bulk customer import ──")
    r = client.post(
        "/api/customers/import",
        json={
            "customers": [
                {"name": "Bulk One", "phone": "+2348010000001", "address": "1 Bulk St, Lagos"},
                {"name": "Bulk Two", "phone": "+2348010000002", "address": "2 Bulk St, Lagos"},
                # duplicate of row 1 within the same file
                {"name": "Bulk One", "phone": "+2348010000001", "address": "1 Bulk St, Lagos"},
                # invalid: no name
                {"name": "", "phone": "+2348010000003", "address": "3 Bulk St, Lagos"},
                # invalid: phone too short
                {"name": "Bulk Three", "phone": "123", "address": "3 Bulk St, Lagos"},
                {"name": "Bulk Four", "phone": "+2348010000004", "address": "4 Bulk St, Lagos"},
            ]
        },
        headers=admin_h,
    )
    check("import accepted (200)", r.status_code == 200, str(r.status_code))
    res = r.get_json()
    check("import reports the row total", res["total"] == 6, str(res.get("total")))
    check("valid rows were created", res["created"] == 3, str(res.get("created")))
    check("in-file duplicate skipped", res["skipped"] == 1, str(res.get("skipped")))
    check(
        "invalid rows reported with line numbers",
        len(res["errors"]) == 2 and {e["row"] for e in res["errors"]} == {4, 5},
        str(res.get("errors")),
    )
    check(
        "one bad row does not block the rest (partial import)",
        res["created"] + res["skipped"] + len(res["errors"]) == res["total"],
    )

    r = client.post(
        "/api/customers/import",
        json={
            "customers": [
                {"name": "Bulk One", "phone": "+2348010000001", "address": "1 Bulk St, Lagos"},
                {"name": "Bulk Two", "phone": "+2348010000002", "address": "2 Bulk St, Lagos"},
            ]
        },
        headers=admin_h,
    )
    check(
        "re-importing the same sheet skips everything",
        r.get_json()["created"] == 0 and r.get_json()["skipped"] == 2,
    )

    check(
        "empty import rejected (422)",
        client.post("/api/customers/import", json={"customers": []}, headers=admin_h).status_code
        == 422,
    )

    r = client.patch(
        f"/api/customers/{new_customer['customerId']}",
        json={"address": "99 Updated Road, Lagos"},
        headers=admin_h,
    )
    check(
        "customer can be edited",
        r.status_code == 200 and r.get_json()["address"] == "99 Updated Road, Lagos",
    )

    print("── PRD conformance: fields the PRD requires explicitly ──")

    # FR3 — "persisting sender identity, recipient details, pickup address, drop-off
    # destination address, line-item descriptions, and creation timestamp"
    r = client.post(
        "/api/deliveries",
        json={
            "customerId": 1,
            "recipientName": "Ngozi Eze",
            "recipientPhone": "+2348031234567",
            "pickupAddress": "12 Adeniran Ogunsanya St, Surulere, Lagos",
            "dropoffAddress": "5 Ozumba Mbadiwe Ave, Victoria Island, Lagos",
            "items": [{"productId": 1, "quantity": 1}],
        },
        headers=admin_h,
    )
    fr3 = r.get_json()
    check("FR3 recipient name persisted", fr3.get("recipientName") == "Ngozi Eze", str(fr3.get("recipientName")))
    check("FR3 recipient phone persisted", fr3.get("recipientPhone") == "+2348031234567")
    check("FR3 sender identity persisted", fr3.get("customerId") == 1)
    check("FR3 creation timestamp persisted", isinstance(fr3.get("dateCreated"), str))

    # FR6 — "capturing service date, odometer reading, workshop work description,
    # spare parts cost, and projected next service due date"
    r = client.post(
        "/api/maintenance",
        json={
            "vehicleId": 1,
            "serviceDate": "2026-10-20",
            "odometer": 13100,
            "description": "Chain lubrication",
            "cost": 2500,
            "nextDueDate": "2027-02-20",
        },
        headers=admin_h,
    )
    fr6 = r.get_json()
    check("FR6 odometer reading persisted", fr6.get("odometer") == 13100, str(fr6.get("odometer")))
    check("FR6 service date persisted", fr6.get("serviceDate") == "2026-10-20")
    check("FR6 cost persisted", fr6.get("cost") == 2500)
    check("FR6 next due date persisted", fr6.get("nextDueDate") == "2027-02-20")

    r = client.post(
        "/api/maintenance",
        json={
            "vehicleId": 1,
            "serviceDate": "2026-10-20",
            "odometer": -5,
            "description": "Bad reading",
            "cost": 1,
            "nextDueDate": "2027-02-20",
        },
        headers=admin_h,
    )
    check("FR6 negative odometer rejected (422)", r.status_code == 422)

    # FR1 — "register, modify, view, and retire vehicle asset records"
    r = client.post(
        "/api/vehicles",
        json={
            "registrationNumber": "MOD-001-AA",
            "make": "Bajaj",
            "model": "Boxer",
            "vehicleType": "bike",
            "odometer": 1000,
        },
        headers=admin_h,
    )
    mod_vehicle = r.get_json()
    r = client.patch(
        f"/api/vehicles/{mod_vehicle['vehicleId']}",
        json={"make": "TVS", "model": "HLX 150", "vehicleType": "trike", "odometer": 4200},
        headers=admin_h,
    )
    modified = r.get_json()
    check("FR1 vehicle can be modified", r.status_code == 200, str(r.status_code))
    check("FR1 make/model/type updated", modified["make"] == "TVS" and modified["vehicleType"] == "trike")
    check("FR1 odometer updated", modified["odometer"] == 4200)

    r = client.patch(
        f"/api/vehicles/{mod_vehicle['vehicleId']}", json={"status": "retired"}, headers=admin_h
    )
    check("FR1 vehicle can be retired", r.get_json()["status"] == "retired")

    r = client.patch(
        f"/api/vehicles/{mod_vehicle['vehicleId']}",
        json={"registrationNumber": "IBD-452-XY"},
        headers=admin_h,
    )
    check("FR1 duplicate registration on edit rejected (409)", r.status_code == 409)

    # FR2 — "create, update, and query rider/driver profiles"
    r = client.post(
        "/api/drivers",
        json={
            "fullName": "Mod Test",
            "phoneNumber": "+2348000000123",
            "licenseNumber": "DL-MOD-0001",
            "licenseExpiryDate": "2027-01-01",
            "status": "available",
        },
        headers=admin_h,
    )
    mod_driver = r.get_json()
    r = client.patch(
        f"/api/drivers/{mod_driver['driverId']}",
        json={
            "fullName": "Mod Test Renamed",
            "phoneNumber": "+2348000000999",
            "licenseNumber": "DL-MOD-0002",
            "licenseExpiryDate": "2028-06-30",
        },
        headers=admin_h,
    )
    updated_driver = r.get_json()
    check("FR2 driver can be updated", r.status_code == 200, str(r.status_code))
    check("FR2 name/phone updated", updated_driver["fullName"] == "Mod Test Renamed" and updated_driver["phoneNumber"] == "+2348000000999")
    check("FR2 licence + expiry updated", updated_driver["licenseNumber"] == "DL-MOD-0002" and updated_driver["licenseExpiryDate"] == "2028-06-30")

    # FR8 — "asset utilization rates, driver availability breakdowns"
    m = client.get("/api/dashboard/metrics?range=30d", headers=admin_h).get_json()
    check("FR8 asset utilisation rate present", isinstance(m.get("assetUtilizationRate"), int))
    check("FR8 utilisation is a percentage", 0 <= m["assetUtilizationRate"] <= 100)
    check("FR8 driver availability breakdown present", set(m["driverAvailability"]) == {"available", "on_delivery", "off_duty"})
    check(
        "FR8 breakdown sums to the roster",
        sum(m["driverAvailability"].values()) == m["totalDrivers"],
    )
    check("FR8 driver roster badges supplied", len(m["driverRoster"]) == m["totalDrivers"])
    check(
        "FR8 roster rows carry a status",
        all(row.get("status") for row in m["driverRoster"]),
    )

    # FR9 — "notify relevant users of key delivery-lifecycle events"
    client.post("/api/notifications/read-all", headers=admin_h)
    client.patch(f"/api/vehicles/{mod_vehicle['vehicleId']}", json={"status": "in_maintenance"}, headers=admin_h)
    notes = client.get("/api/notifications?category=fleet", headers=admin_h).get_json()
    check(
        "FR9 taking a vehicle off the road raises a notification",
        any("off the road" in n["title"] for n in notes),
        str([n["title"] for n in notes][:3]),
    )

    print(f"\n{PASSED} passed, {FAILED} failed")
    return 1 if FAILED else 0


if __name__ == "__main__":
    sys.exit(main())
