import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTrip } from "@/lib/constants";
import { validateTripAssignment } from "@/lib/trip-validations";

const tripInclude = {
  vehicle: true,
  driver: true,
};

export async function GET(request) {
  try {
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
    const body = await request.json();
    const { source, destination, cargoWeight, vehicleId, driverId, plannedDistance, revenue } =
      body;

    if (!source?.trim() || !destination?.trim()) {
      return NextResponse.json(
        { error: "Source and destination are required." },
        { status: 400 },
      );
    }

    if (vehicleId && driverId) {
      const validation = await validateTripAssignment(prisma, {
        vehicleId,
        driverId,
        cargoWeight,
      });

      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
      }
    }

    const trip = await prisma.trip.create({
      data: {
        source: source.trim(),
        destination: destination.trim(),
        cargoWeight,
        plannedDistance: plannedDistance || null,
        revenue: revenue || 0,
        vehicleId: vehicleId ? Number(vehicleId) : null,
        driverId: driverId ? Number(driverId) : null,
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
