/**
 * Idempotent bulk seed: top each dataset up to ~35 rows.
 * Safe to re-run — skips entities that already exist by unique key / markers.
 *
 * Usage: node --env-file=.env prisma/seed-bulk.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const TARGET = 35;

const REGIONS = ["West", "North", "South", "East", "Central"];
const VEHICLE_TYPES = ["Van", "Truck", "Pickup", "SUV", "Container", "Dumper"];
const MAINT_TYPES = [
  "Oil Change",
  "Tyre Replacement",
  "Brake Repair",
  "Battery Check",
  "Engine Tune-up",
  "AC Service",
  "Suspension Check",
  "Electrical Repair",
];
const MAINT_STATUSES = ["Completed", "Completed", "Completed", "Pending", "Urgent"];
const EXPENSE_TYPES = [
  "Toll",
  "Parking",
  "Permit",
  "Insurance",
  "Cleaning",
  "Fine",
  "Lodging",
  "Miscellaneous",
];
const CITIES = [
  "Mumbai",
  "Pune",
  "Nashik",
  "Nagpur",
  "Surat",
  "Rajkot",
  "Ahmedabad",
  "Indore",
  "Bhopal",
  "Jaipur",
  "Delhi",
  "Chennai",
  "Bengaluru",
  "Hyderabad",
  "Kolkata",
  "Goa",
  "Vadodara",
  "Aurangabad",
  "Solapur",
  "Kolhapur",
];
const FIRST_NAMES = [
  "Rahul",
  "Priya",
  "Amit",
  "Sneha",
  "Vikram",
  "Ananya",
  "Rohan",
  "Meera",
  "Karan",
  "Neha",
  "Arjun",
  "Pooja",
  "Suresh",
  "Kavita",
  "Nikhil",
  "Divya",
  "Manish",
  "Ritu",
  "Sanjay",
  "Isha",
  "Deepak",
  "Anjali",
  "Harsh",
  "Tanvi",
  "Yash",
  "Shreya",
  "Aditya",
  "Nisha",
  "Varun",
  "Kriti",
  "Gaurav",
  "Pallavi",
  "Ravi",
  "Swati",
  "Mohit",
];
const LAST_NAMES = [
  "Sharma",
  "Patel",
  "Kumar",
  "Singh",
  "Joshi",
  "Desai",
  "Mehta",
  "Reddy",
  "Nair",
  "Gupta",
  "Iyer",
  "Chopra",
  "Verma",
  "Malhotra",
  "Khan",
];

function daysFromNow(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

function pick(arr, i) {
  return arr[i % arr.length];
}

async function ensureRoles() {
  const names = [
    "Fleet Manager",
    "Dispatcher",
    "Safety Officer",
    "Financial Analyst",
  ];
  for (const name of names) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  return prisma.role.findMany();
}

async function seedUsers(roles) {
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));
  const passwordHash = await bcrypt.hash("password123", 10);
  const roleCycle = [
    "Fleet Manager",
    "Dispatcher",
    "Safety Officer",
    "Financial Analyst",
  ];

  let created = 0;
  for (let i = 1; i <= TARGET; i++) {
    const email = `demo.user${String(i).padStart(2, "0")}@transitops.com`;
    const roleName = pick(roleCycle, i - 1);
    const name = `Demo ${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 3)}`;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        roleId: roleByName[roleName].id,
      },
    });
    created++;
  }
  return created;
}

async function seedVehicles() {
  let created = 0;
  for (let i = 1; i <= TARGET; i++) {
    const registrationNumber = `MH-BULK-${String(i).padStart(4, "0")}`;
    const vehicleName = `Fleet-${String(i).padStart(2, "0")}`;
    const type = pick(VEHICLE_TYPES, i);
    const capacityByType = {
      Van: 500,
      Truck: 2000,
      Pickup: 800,
      SUV: 600,
      Container: 5000,
      Dumper: 3000,
    };
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber },
    });
    if (existing) continue;

    // Keep most Available; a few In Shop for realism
    let status = "Available";
    if (i % 17 === 0) status = "In Shop";

    await prisma.vehicle.create({
      data: {
        registrationNumber,
        vehicleName,
        type,
        maxLoadCapacity: capacityByType[type] ?? 1000,
        odometer: 8000 + i * 3700,
        acquisitionCost: 600000 + i * 45000,
        status,
        region: pick(REGIONS, i),
      },
    });
    created++;
  }
  return created;
}

async function seedDrivers() {
  let created = 0;
  for (let i = 1; i <= TARGET; i++) {
    const licenseNumber = `DL-BULK-${String(i).padStart(5, "0")}`;
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber },
    });
    if (existing) continue;

    let status = "Available";
    // A couple suspended / expired-license cases for validation demos
    if (i === 30) status = "Suspended";
    if (i === 31) status = "Suspended";

    const expiry =
      i === 32 ? daysFromNow(-40) /* expired */ : daysFromNow(180 + i * 10);

    await prisma.driver.create({
      data: {
        name: `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 5)}`,
        licenseNumber,
        licenseCategory: i % 3 === 0 ? "HMV" : i % 3 === 1 ? "LMV" : "MMV",
        licenseExpiryDate: expiry,
        contactNumber: `98${String(70000000 + i).slice(0, 8)}`,
        safetyScore: 70 + (i % 30),
        status,
      },
    });
    created++;
  }
  return created;
}

async function seedTrips(vehicles, drivers) {
  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const availableDrivers = drivers.filter(
    (d) => d.status === "Available" && new Date(d.licenseExpiryDate) >= new Date(),
  );

  const statusPlan = [];
  // Mix of statuses across TARGET trips
  for (let i = 0; i < TARGET; i++) {
    if (i < 10) statusPlan.push("Draft");
    else if (i < 14) statusPlan.push("Dispatched");
    else if (i < 16) statusPlan.push("In Progress");
    else if (i < 30) statusPlan.push("Completed");
    else statusPlan.push("Cancelled");
  }

  const usedVehicleIds = new Set();
  const usedDriverIds = new Set();
  let created = 0;

  const existingBulk = await prisma.trip.count({
    where: { source: { startsWith: "Bulk-" } },
  });
  if (existingBulk >= TARGET) return 0;

  for (let i = 0; i < TARGET; i++) {
    const sourceCity = pick(CITIES, i);
    const destCity = pick(CITIES, i + 7);
    const source = `Bulk-${String(i + 1).padStart(2, "0")} ${sourceCity} Depot`;
    const destination = `${destCity} Hub`;

    const exists = await prisma.trip.findFirst({ where: { source } });
    if (exists) continue;

    const status = statusPlan[i];
    const isActive = status === "Dispatched" || status === "In Progress";

    let vehicle = availableVehicles[i % availableVehicles.length];
    let driver = availableDrivers[i % availableDrivers.length];

    if (isActive) {
      vehicle =
        availableVehicles.find((v) => !usedVehicleIds.has(v.id)) ?? vehicle;
      driver =
        availableDrivers.find((d) => !usedDriverIds.has(d.id)) ?? driver;
      usedVehicleIds.add(vehicle.id);
      usedDriverIds.add(driver.id);
    }

    const cargoCap = Number(vehicle.maxLoadCapacity);
    const cargoWeight = Math.max(50, Math.round(cargoCap * (0.35 + (i % 5) * 0.1)));
    const plannedDistance = 80 + i * 17;

    await prisma.trip.create({
      data: {
        source,
        destination,
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoWeight,
        plannedDistance,
        finalOdometer:
          status === "Completed"
            ? Number(vehicle.odometer) + plannedDistance
            : null,
        fuelConsumed: status === "Completed" ? 20 + (i % 40) : null,
        revenue: status === "Cancelled" ? 0 : 8000 + i * 1500,
        status,
      },
    });

    if (isActive) {
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: "On Trip" },
      });
      await prisma.driver.update({
        where: { id: driver.id },
        data: { status: "On Trip" },
      });
    }
    created++;
  }
  return created;
}

async function seedMaintenance(vehicles) {
  const existing = await prisma.maintenanceLog.count({
    where: { description: { startsWith: "[BULK]" } },
  });
  if (existing >= TARGET) return 0;

  let created = 0;
  for (let i = 0; i < TARGET; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const status = pick(MAINT_STATUSES, i);
    const startDate = daysFromNow(-(40 + i));
    const endDate = status === "Completed" ? daysFromNow(-(30 + i)) : null;

    await prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicle.id,
        maintenanceType: pick(MAINT_TYPES, i),
        description: `[BULK] Scheduled service #${i + 1} for ${vehicle.vehicleName}`,
        cost: 1500 + i * 220,
        status,
        startDate,
        endDate,
      },
    });
    created++;
  }
  return created;
}

async function seedFuel(vehicles, trips) {
  const existing = await prisma.fuelLog.count({
    where: { date: { gte: new Date("2026-01-01") } },
  });
  // Use a softer check: if already many fuel logs, still top up toward TARGET
  const current = await prisma.fuelLog.count();
  if (current >= TARGET) return 0;

  const completedTrips = trips.filter((t) => t.status === "Completed");
  let created = 0;
  const need = TARGET - current;

  for (let i = 0; i < need; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const trip = completedTrips[i % Math.max(completedTrips.length, 1)];
    const liters = 25 + (i % 50);
    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicle.id,
        tripId: trip?.id ?? null,
        liters,
        cost: liters * (95 + (i % 10)),
        date: daysFromNow(-(i + 1)),
      },
    });
    created++;
  }
  return created;
}

async function seedExpenses(vehicles, trips) {
  const existing = await prisma.expense.count({
    where: { description: { startsWith: "[BULK]" } },
  });
  if (existing >= TARGET) return 0;

  let created = 0;
  for (let i = 0; i < TARGET; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const trip = trips[i % Math.max(trips.length, 1)];
    await prisma.expense.create({
      data: {
        vehicleId: vehicle.id,
        tripId: trip?.id ?? null,
        expenseType: pick(EXPENSE_TYPES, i),
        amount: 200 + i * 85,
        description: `[BULK] Expense #${i + 1} — ${pick(EXPENSE_TYPES, i)}`,
        date: daysFromNow(-(i + 2)),
      },
    });
    created++;
  }
  return created;
}

async function main() {
  console.log("=== Bulk seed starting (target ~" + TARGET + " per dataset) ===");
  const roles = await ensureRoles();

  const usersCreated = await seedUsers(roles);
  console.log(`users: +${usersCreated}`);

  const vehiclesCreated = await seedVehicles();
  console.log(`vehicles: +${vehiclesCreated}`);

  const driversCreated = await seedDrivers();
  console.log(`drivers: +${driversCreated}`);

  const vehicles = await prisma.vehicle.findMany();
  const drivers = await prisma.driver.findMany();

  const tripsCreated = await seedTrips(vehicles, drivers);
  console.log(`trips: +${tripsCreated}`);

  const trips = await prisma.trip.findMany();

  const maintCreated = await seedMaintenance(vehicles);
  console.log(`maintenance: +${maintCreated}`);

  const fuelCreated = await seedFuel(vehicles, trips);
  console.log(`fuel: +${fuelCreated}`);

  const expensesCreated = await seedExpenses(vehicles, trips);
  console.log(`expenses: +${expensesCreated}`);

  const counts = {
    roles: await prisma.role.count(),
    users: await prisma.user.count(),
    vehicles: await prisma.vehicle.count(),
    drivers: await prisma.driver.count(),
    trips: await prisma.trip.count(),
    maintenance: await prisma.maintenanceLog.count(),
    fuel: await prisma.fuelLog.count(),
    expenses: await prisma.expense.count(),
  };
  console.log("=== FINAL COUNTS ===");
  console.log(JSON.stringify(counts, null, 2));
  console.log(
    "Demo logins: demo.user01@transitops.com … demo.user35@transitops.com / password123",
  );
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
