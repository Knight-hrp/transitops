const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const roles = [
    "Fleet Manager",
    "Dispatcher",
    "Safety Officer",
    "Financial Analyst",
  ];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const vehicles = [
    {
      registrationNumber: "MH-12-AB-1001",
      vehicleName: "Van-05",
      type: "Van",
      maxLoadCapacity: 500,
      odometer: 42000,
      acquisitionCost: 850000,
      status: "Available",
      region: "West",
    },
    {
      registrationNumber: "MH-12-TR-2002",
      vehicleName: "Truck-02",
      type: "Truck",
      maxLoadCapacity: 2000,
      odometer: 128000,
      acquisitionCost: 2200000,
      status: "Available",
      region: "North",
    },
    {
      registrationNumber: "MH-12-PK-3003",
      vehicleName: "Pickup-11",
      type: "Pickup",
      maxLoadCapacity: 800,
      odometer: 65000,
      acquisitionCost: 1100000,
      status: "Available",
      region: "South",
    },
  ];

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { registrationNumber: vehicle.registrationNumber },
      update: {},
      create: vehicle,
    });
  }

  const drivers = [
    {
      name: "Rahul Sharma",
      licenseNumber: "DL-2020-10001",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2027-06-15"),
      contactNumber: "9876543210",
      safetyScore: 92,
      status: "Available",
    },
    {
      name: "Priya Patel",
      licenseNumber: "DL-2019-20002",
      licenseCategory: "LMV",
      licenseExpiryDate: new Date("2026-12-01"),
      contactNumber: "9876543211",
      safetyScore: 88,
      status: "Available",
    },
    {
      name: "Amit Kumar",
      licenseNumber: "DL-2018-30003",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2025-01-01"),
      contactNumber: "9876543212",
      safetyScore: 75,
      status: "Suspended",
    },
  ];

  for (const driver of drivers) {
    await prisma.driver.upsert({
      where: { licenseNumber: driver.licenseNumber },
      update: {},
      create: driver,
    });
  }

  const maintenanceLogs = [
    {
      vehicleName: "Van-05",
      maintenanceType: "Oil Change",
      description: "Routine engine oil and filter replacement",
      cost: 2500,
      status: "Completed",
      startDate: new Date("2026-07-12"),
      endDate: new Date("2026-07-12"),
    },
    {
      vehicleName: "Truck-02",
      maintenanceType: "Tyre Replacement",
      description: "Replaced all four tyres before route deployment",
      cost: 6000,
      status: "Pending",
      startDate: new Date("2026-07-15"),
      endDate: null,
    },
    {
      vehicleName: "Pickup-11",
      maintenanceType: "Brake Repair",
      description: "Serviced brake pads and checked fluid levels",
      cost: 8200,
      status: "Urgent",
      startDate: new Date("2026-07-18"),
      endDate: null,
    },
  ];

  for (const log of maintenanceLogs) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { vehicleName: log.vehicleName },
    });

    if (vehicle) {
      await prisma.maintenanceLog.create({
        data: {
          vehicleId: vehicle.id,
          maintenanceType: log.maintenanceType,
          description: log.description,
          cost: log.cost,
          status: log.status,
          startDate: log.startDate,
          endDate: log.endDate,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
