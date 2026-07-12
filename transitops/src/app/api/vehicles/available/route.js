import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeVehicle } from "@/lib/constants";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: "Available" },
      orderBy: { vehicleName: "asc" },
    });

    return NextResponse.json(vehicles.map(serializeVehicle));
  } catch (error) {
    console.error("GET /api/vehicles/available", error);
    return NextResponse.json({ error: "Failed to fetch vehicles." }, { status: 500 });
  }
}
