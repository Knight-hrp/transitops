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
    status: "Available",
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
    status: "Available",
  },
];

export const MOCK_TRIPS = [
  {
    id: 1,
    source: "Mumbai Warehouse",
    destination: "Pune Distribution Center",
    cargoWeight: 450,
    status: "Draft",
    vehicle: { vehicleName: "Van-05" },
    driver: { name: "Rahul Sharma" },
  },
  {
    id: 2,
    source: "Delhi Hub",
    destination: "Jaipur Depot",
    cargoWeight: 1200,
    status: "Dispatched",
    vehicle: { vehicleName: "Truck-02" },
    driver: { name: "Priya Patel" },
  },
];
