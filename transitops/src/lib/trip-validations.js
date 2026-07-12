import {
  ACTIVE_TRIP_STATUSES,
  DRIVER_STATUS,
  TRIP_STATUS,
  VEHICLE_STATUS,
  toNumber,
} from "./constants";

function isLicenseExpired(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return expiry < today;
}

export function formatValidationResponse(errors) {
  return {
    error: errors.join(" "),
    errors,
  };
}

export function assertTripEditable(trip) {
  if (!trip) return "Trip not found.";
  if (trip.status === TRIP_STATUS.COMPLETED) {
    return "Completed trips cannot be edited.";
  }
  if (trip.status === TRIP_STATUS.CANCELLED) {
    return "Cancelled trips cannot be edited.";
  }
  return null;
}

export async function validateTripAssignment(
  prisma,
  { vehicleId, driverId, cargoWeight, tripId },
) {
  const errors = [];

  if (!vehicleId) errors.push("Vehicle is required.");
  if (!driverId) errors.push("Driver is required.");
  if (cargoWeight == null || Number(cargoWeight) <= 0) {
    errors.push("Cargo weight must be greater than 0.");
  }

  if (errors.length) return { valid: false, errors };

  const [vehicle, driver, activeMaintenance] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } }),
    prisma.driver.findUnique({ where: { id: Number(driverId) } }),
    prisma.maintenanceLog.findFirst({
      where: { vehicleId: Number(vehicleId), status: "Active" },
    }),
  ]);

  if (!vehicle) errors.push("Selected vehicle does not exist.");
  if (!driver) errors.push("Selected driver does not exist.");

  if (vehicle) {
    if (vehicle.status === VEHICLE_STATUS.IN_SHOP || activeMaintenance) {
      errors.push("Vehicle is in maintenance (In Shop) and cannot be dispatched.");
    } else if (vehicle.status === VEHICLE_STATUS.ON_TRIP) {
      errors.push("Vehicle is already on a trip.");
    } else if (vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
      errors.push(`Vehicle is not available (current status: ${vehicle.status}).`);
    }

    if (Number(cargoWeight) > toNumber(vehicle.maxLoadCapacity)) {
      errors.push(
        `Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${toNumber(vehicle.maxLoadCapacity)} kg).`,
      );
    }
  }

  if (driver) {
    if (driver.status === DRIVER_STATUS.SUSPENDED) {
      errors.push("Driver is suspended and cannot be assigned.");
    } else if (driver.status === DRIVER_STATUS.ON_TRIP) {
      errors.push("Driver is already on a trip.");
    } else if (driver.status !== DRIVER_STATUS.AVAILABLE) {
      errors.push(`Driver is not available (current status: ${driver.status}).`);
    }

    if (isLicenseExpired(driver.licenseExpiryDate)) {
      errors.push("Driver license has expired.");
    }
  }

  const conflictingTrip = await prisma.trip.findFirst({
    where: {
      id: tripId ? { not: Number(tripId) } : undefined,
      status: { in: ACTIVE_TRIP_STATUSES },
      OR: [{ vehicleId: Number(vehicleId) }, { driverId: Number(driverId) }],
    },
  });

  if (conflictingTrip) {
    errors.push(
      `Vehicle or driver is already assigned to active trip #${conflictingTrip.id}.`,
    );
  }

  return { valid: errors.length === 0, errors, vehicle, driver };
}

export function assertTripTransition(trip, action) {
  const status = trip.status;

  if (action === "dispatch") {
    if (status !== TRIP_STATUS.DRAFT) {
      return `Only draft trips can be dispatched (current: ${status}).`;
    }
    if (!trip.vehicleId || !trip.driverId) {
      return "Assign a vehicle and driver before dispatching.";
    }
  }

  if (action === "complete") {
    if (!ACTIVE_TRIP_STATUSES.includes(status)) {
      return `Only active trips can be completed (current: ${status}).`;
    }
  }

  if (action === "cancel") {
    if (status === TRIP_STATUS.COMPLETED) {
      return "Completed trips cannot be cancelled.";
    }
    if (status === TRIP_STATUS.CANCELLED) {
      return "Trip is already cancelled.";
    }
  }

  return null;
}
