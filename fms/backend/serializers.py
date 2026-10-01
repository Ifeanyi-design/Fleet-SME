"""JSON serialisation.

Field names are camelCase to match the TypeScript domain model in
`fms/src/types/domain.ts` exactly, so the frontend needs no adapters.
"""

from datetime import date, datetime


def iso(value: date | datetime | None) -> str | None:
    return value.isoformat() if value is not None else None


def customer_to_dict(customer) -> dict:
    return {
        "customerId": customer.customer_id,
        "name": customer.name,
        "phone": customer.phone,
        "address": customer.address,
    }


def driver_to_dict(driver) -> dict:
    return {
        "driverId": driver.driver_id,
        "fullName": driver.full_name,
        "phoneNumber": driver.phone_number,
        "licenseNumber": driver.license_number,
        "licenseExpiryDate": iso(driver.license_expiry_date),
        "status": driver.status,
    }


def vehicle_to_dict(vehicle) -> dict:
    return {
        "vehicleId": vehicle.vehicle_id,
        "registrationNumber": vehicle.registration_number,
        "make": vehicle.make,
        "model": vehicle.model,
        "vehicleType": vehicle.vehicle_type,
        "status": vehicle.status,
        "odometer": vehicle.odometer,
    }


def product_to_dict(product) -> dict:
    return {
        "productId": product.product_id,
        "productName": product.product_name,
        "category": product.category,
    }


def delivery_item_to_dict(item) -> dict:
    return {
        "deliveryId": item.delivery_id,
        "productId": item.product_id,
        "quantity": item.quantity,
        "product": product_to_dict(item.product) if item.product else None,
    }


def maintenance_to_dict(log, vehicle=None) -> dict:
    return {
        "maintenanceId": log.maintenance_id,
        "vehicleId": log.vehicle_id,
        "serviceDate": iso(log.service_date),
        "odometer": log.odometer,
        "description": log.description,
        "cost": float(log.cost or 0),
        "nextDueDate": iso(log.next_due_date),
        "vehicle": vehicle_to_dict(vehicle) if vehicle is not None else None,
    }


def delivery_to_dict(delivery, *, with_relations: bool = True) -> dict:
    payload = {
        "deliveryId": delivery.delivery_id,
        "customerId": delivery.customer_id,
        "driverId": delivery.driver_id,
        "vehicleId": delivery.vehicle_id,
        "recipientName": delivery.recipient_name,
        "recipientPhone": delivery.recipient_phone,
        "pickupAddress": delivery.pickup_address,
        "dropoffAddress": delivery.dropoff_address,
        "status": delivery.status,
        "dateCreated": iso(delivery.date_created),
        "dateDelivered": iso(delivery.date_delivered),
        "trackingCode": delivery.tracking_code,
    }

    if with_relations:
        payload["customer"] = customer_to_dict(delivery.customer) if delivery.customer else None
        payload["driver"] = driver_to_dict(delivery.driver) if delivery.driver else None
        payload["vehicle"] = vehicle_to_dict(delivery.vehicle) if delivery.vehicle else None
        payload["items"] = [delivery_item_to_dict(item) for item in delivery.items]

    return payload


def notification_to_dict(notification) -> dict:
    return {
        "notificationId": notification.notification_id,
        "category": notification.category,
        "severity": notification.severity,
        "title": notification.title,
        "body": notification.body,
        "link": notification.link,
        "isRead": notification.is_read,
        "createdAt": iso(notification.created_at),
        "readAt": iso(notification.read_at),
    }


def user_to_dict(user, driver=None) -> dict:
    """Authentication principal.

    `driverId` links a driver login to its DRIVER row so the mobile views resolve the
    rider's own record and waybills. `driver` is embedded on login/me so the driver app
    does not need a second round trip (and so a driver can read their own record without
    admin rights).
    """
    payload = {
        "userId": user.user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "driverId": user.driver_id,
    }
    if driver is not None:
        payload["driver"] = driver_to_dict(driver)
    return payload
