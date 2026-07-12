export const TRIP_STATUS = {
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const VEHICLE_STATUS = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
};

export const DRIVER_STATUS = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  SUSPENDED: "Suspended",
};

export const ACTIVE_TRIP_STATUSES = [
  TRIP_STATUS.DISPATCHED,
  TRIP_STATUS.IN_PROGRESS,
];

export function toNumber(value) {
  if (value == null) return 0;
  return typeof value === "object" && "toNumber" in value
    ? value.toNumber()
    : Number(value);
}

export function serializeTrip(trip) {
  return {
    ...trip,
    cargoWeight: toNumber(trip.cargoWeight),
    plannedDistance: trip.plannedDistance ? toNumber(trip.plannedDistance) : null,
    scheduledDate: trip.scheduledDate ? trip.scheduledDate.toISOString().slice(0, 10) : null,
    startDate: trip.startDate ? trip.startDate.toISOString().slice(0, 10) : null,
    endDate: trip.endDate ? trip.endDate.toISOString().slice(0, 10) : null,
    finalOdometer: trip.finalOdometer ? toNumber(trip.finalOdometer) : null,
    fuelConsumed: trip.fuelConsumed ? toNumber(trip.fuelConsumed) : null,
    revenue: toNumber(trip.revenue),
    vehicle: trip.vehicle
      ? {
          ...trip.vehicle,
          maxLoadCapacity: toNumber(trip.vehicle.maxLoadCapacity),
          odometer: toNumber(trip.vehicle.odometer),
          acquisitionCost: toNumber(trip.vehicle.acquisitionCost),
        }
      : null,
    driver: trip.driver
      ? {
          ...trip.driver,
          safetyScore: toNumber(trip.driver.safetyScore),
        }
      : null,
  };
}

export function serializeVehicle(vehicle) {
  return {
    ...vehicle,
    maxLoadCapacity: toNumber(vehicle.maxLoadCapacity),
    odometer: toNumber(vehicle.odometer),
    acquisitionCost: toNumber(vehicle.acquisitionCost),
  };
}

export function serializeDriver(driver) {
  return {
    ...driver,
    safetyScore: toNumber(driver.safetyScore),
  };
}
