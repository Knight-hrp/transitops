import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DRIVER_STATUS,
  TRIP_STATUS,
  VEHICLE_STATUS,
  serializeTrip,
} from "@/lib/constants";
import {
  assertTripTransition,
  validateTripAssignment,
} from "@/lib/trip-validations";

const tripInclude = { vehicle: true, driver: true };

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const tripId = Number(id);

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: tripInclude,
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    const transitionError = assertTripTransition(trip, "dispatch");
    if (transitionError) {
      return NextResponse.json({ error: transitionError }, { status: 400 });
    }

    const validation = await validateTripAssignment(prisma, {
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      cargoWeight: trip.cargoWeight,
      tripId,
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(" ") }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VEHICLE_STATUS.ON_TRIP },
      });
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DRIVER_STATUS.ON_TRIP },
      });
      return tx.trip.update({
        where: { id: tripId },
        data: { status: TRIP_STATUS.DISPATCHED },
        include: tripInclude,
      });
    });

    return NextResponse.json(serializeTrip(updated));
  } catch (error) {
    console.error("POST /api/trips/[id]/dispatch", error);
    return NextResponse.json({ error: "Failed to dispatch trip." }, { status: 500 });
  }
}
