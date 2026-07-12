import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTrip } from "@/lib/constants";
import { requireRole } from "@/lib/api-auth";
import {
  assertTripEditable,
  formatValidationResponse,
  validateTripAssignment,
} from "@/lib/trip-validations";

const tripInclude = {
  vehicle: true,
  driver: true,
};

const TRIP_ROLES = ["Dispatcher"];

export async function GET(_request, { params }) {
  try {
    const { error } = await requireRole(TRIP_ROLES);
    if (error) return error;

    const { id } = await params;
    const trip = await prisma.trip.findUnique({
      where: { id: Number(id) },
      include: tripInclude,
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    return NextResponse.json(serializeTrip(trip));
  } catch (error) {
    console.error("GET /api/trips/[id]", error);
    return NextResponse.json({ error: "Failed to fetch trip." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { error } = await requireRole(TRIP_ROLES);
    if (error) return error;

    const { id } = await params;
    const tripId = Number(id);

    const existing = await prisma.trip.findUnique({
      where: { id: tripId },
      include: tripInclude,
    });

    if (!existing) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    const editableError = assertTripEditable(existing);
    if (editableError) {
      return NextResponse.json(formatValidationResponse([editableError]), {
        status: 400,
      });
    }

    const body = await request.json();
    const nextSource = body.source?.trim() ?? existing.source;
    const nextDestination = body.destination?.trim() ?? existing.destination;
    const nextCargoWeight =
      body.cargoWeight != null ? Number(body.cargoWeight) : existing.cargoWeight;
    const nextVehicleId =
      body.vehicleId != null ? Number(body.vehicleId) : existing.vehicleId;
    const nextDriverId =
      body.driverId != null ? Number(body.driverId) : existing.driverId;
    const nextPlannedDistance =
      body.plannedDistance != null
        ? Number(body.plannedDistance)
        : existing.plannedDistance;

    if (!nextSource || !nextDestination) {
      return NextResponse.json(
        formatValidationResponse(["Source and destination are required."]),
        { status: 400 },
      );
    }

    const validation = await validateTripAssignment(prisma, {
      vehicleId: nextVehicleId,
      driverId: nextDriverId,
      cargoWeight: nextCargoWeight,
      tripId,
    });

    if (!validation.valid) {
      return NextResponse.json(formatValidationResponse(validation.errors), {
        status: 400,
      });
    }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        source: nextSource,
        destination: nextDestination,
        cargoWeight: nextCargoWeight,
        vehicleId: nextVehicleId,
        driverId: nextDriverId,
        plannedDistance: nextPlannedDistance,
      },
      include: tripInclude,
    });

    return NextResponse.json(serializeTrip(trip));
  } catch (error) {
    console.error("PATCH /api/trips/[id]", error);
    return NextResponse.json({ error: "Failed to update trip." }, { status: 500 });
  }
}
