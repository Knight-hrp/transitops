import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTrip } from "@/lib/constants";
import { requireRole } from "@/lib/api-auth";
import {
  formatValidationResponse,
  validateTripAssignment,
} from "@/lib/trip-validations";

const tripInclude = {
  vehicle: true,
  driver: true,
};

const TRIP_ROLES = ["Dispatcher"];

export async function GET(request) {
  try {
    const { error } = await requireRole(TRIP_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const trips = await prisma.trip.findMany({
      where: status ? { status } : undefined,
      include: tripInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trips.map(serializeTrip));
  } catch (error) {
    console.error("GET /api/trips", error);
    return NextResponse.json({ error: "Failed to fetch trips." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { error } = await requireRole(TRIP_ROLES);
    if (error) return error;

    const body = await request.json();
    const { source, destination, cargoWeight, vehicleId, driverId, plannedDistance, revenue } =
      body;

    if (!source?.trim() || !destination?.trim()) {
      return NextResponse.json(
        formatValidationResponse(["Source and destination are required."]),
        { status: 400 },
      );
    }

    if (!vehicleId || !driverId) {
      return NextResponse.json(
        formatValidationResponse(["Vehicle and driver are required."]),
        { status: 400 },
      );
    }

    const validation = await validateTripAssignment(prisma, {
      vehicleId,
      driverId,
      cargoWeight,
    });

    if (!validation.valid) {
      return NextResponse.json(formatValidationResponse(validation.errors), {
        status: 400,
      });
    }

    const trip = await prisma.trip.create({
      data: {
        source: source.trim(),
        destination: destination.trim(),
        cargoWeight,
        plannedDistance: plannedDistance || null,
        revenue: revenue || 0,
        vehicleId: Number(vehicleId),
        driverId: Number(driverId),
        status: "Draft",
      },
      include: tripInclude,
    });

    return NextResponse.json(serializeTrip(trip), { status: 201 });
  } catch (error) {
    console.error("POST /api/trips", error);
    return NextResponse.json({ error: "Failed to create trip." }, { status: 500 });
  }
}
