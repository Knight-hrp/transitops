import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeVehicle } from "@/lib/constants";
import { requireRole } from "@/lib/api-auth";

const TRIP_ROLES = ["Dispatcher"];

export async function GET() {
  try {
    const { error } = await requireRole(TRIP_ROLES);
    if (error) return error;

    const openMaintenance = await prisma.maintenanceLog.findMany({
      where: { NOT: { status: "Completed" } },
      select: { vehicleId: true },
    });
    const inMaintenanceIds = [
      ...new Set(openMaintenance.map((log) => log.vehicleId)),
    ];

    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: "Available",
        ...(inMaintenanceIds.length
          ? { id: { notIn: inMaintenanceIds } }
          : {}),
      },
      orderBy: { vehicleName: "asc" },
    });

    return NextResponse.json(vehicles.map(serializeVehicle));
  } catch (error) {
    console.error("GET /api/vehicles/available", error);
    return NextResponse.json({ error: "Failed to fetch vehicles." }, { status: 500 });
  }
}
