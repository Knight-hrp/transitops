import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeDriver } from "@/lib/constants";
import { requireRole } from "@/lib/api-auth";

const TRIP_ROLES = ["Dispatcher"];

export async function GET() {
  try {
    const { error } = await requireRole(TRIP_ROLES);
    if (error) return error;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const drivers = await prisma.driver.findMany({
      where: {
        status: "Available",
        licenseExpiryDate: { gte: today },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(drivers.map(serializeDriver));
  } catch (error) {
    console.error("GET /api/drivers/available", error);
    return NextResponse.json({ error: "Failed to fetch drivers." }, { status: 500 });
  }
}
