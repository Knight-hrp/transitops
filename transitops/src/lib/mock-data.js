export const MOCK_VEHICLES = [
  {
    id: 1,
    vehicleName: "Van-05",
    registrationNumber: "MH-12-AB-1001",
    maxLoadCapacity: 500,
    status: "Available",
  },
  {
    id: 2,
    vehicleName: "Truck-02",
    registrationNumber: "MH-12-TR-2002",
    maxLoadCapacity: 2000,
    status: "On Trip",
  },
  {
    id: 3,
    vehicleName: "Pickup-11",
    registrationNumber: "MH-12-PK-3003",
    maxLoadCapacity: 800,
    status: "Available",
  },
];

export const MOCK_DRIVERS = [
  {
    id: 1,
    name: "Rahul Sharma",
    licenseNumber: "DL-2020-10001",
    status: "Available",
  },
  {
    id: 2,
    name: "Priya Patel",
    licenseNumber: "DL-2019-20002",
    status: "On Trip",
  },
];

export const MOCK_TRIPS = [
  {
    id: 1,
    source: "Mumbai Warehouse",
    destination: "Pune Distribution Center",
    cargoWeight: 450,
    plannedDistance: 150,
    status: "Draft",
    vehicle: { vehicleName: "Van-05", status: "Available" },
    driver: { name: "Rahul Sharma", status: "Available" },
  },
  {
    id: 2,
    source: "Delhi Hub",
    destination: "Jaipur Depot",
    cargoWeight: 1200,
    plannedDistance: 280,
    status: "Dispatched",
    vehicle: { vehicleName: "Truck-02", status: "On Trip" },
    driver: { name: "Priya Patel", status: "On Trip" },
  },
  {
    id: 3,
    source: "Chennai Port",
    destination: "Bangalore DC",
    cargoWeight: 600,
    plannedDistance: 350,
    status: "Completed",
    vehicle: { vehicleName: "Pickup-11", status: "Available" },
    driver: { name: "Rahul Sharma", status: "Available" },
  },
];

export function getMockTripById(id) {
  const tripId = Number(id);
  const trip = MOCK_TRIPS.find((entry) => entry.id === tripId);
  if (!trip) return null;
  return structuredClone(trip);
}

export function applyMockTripAction(trip, action) {
  const next = structuredClone(trip);

  if (action === "dispatch") {
    if (next.status !== "Draft") return { error: "Only draft trips can be dispatched." };
    next.status = "Dispatched";
    if (next.vehicle) next.vehicle.status = "On Trip";
    if (next.driver) next.driver.status = "On Trip";
    return { trip: next };
  }

  if (action === "complete") {
    if (!["Dispatched", "In Progress"].includes(next.status)) {
      return { error: "Only active trips can be completed." };
    }
    next.status = "Completed";
    if (next.vehicle) next.vehicle.status = "Available";
    if (next.driver) next.driver.status = "Available";
    return { trip: next };
  }

  if (action === "cancel") {
    if (["Completed", "Cancelled"].includes(next.status)) {
      return { error: "This trip cannot be cancelled." };
    }
    const wasActive = ["Dispatched", "In Progress"].includes(next.status);
    next.status = "Cancelled";
    if (wasActive) {
      if (next.vehicle) next.vehicle.status = "Available";
      if (next.driver) next.driver.status = "Available";
    }
    return { trip: next };
  }

  return { error: "Unknown action." };
}
