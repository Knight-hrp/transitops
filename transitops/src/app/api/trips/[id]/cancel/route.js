import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DRIVER_STATUS,
  TRIP_STATUS,
  VEHICLE_STATUS,
  serializeTrip,
} from "@/lib/constants";
import { assertTripTransition } from "@/lib/trip-validations";

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

    const transitionError = assertTripTransition(trip, "cancel");
    if (transitionError) {
      return NextResponse.json({ error: transitionError }, { status: 400 });
    }

    const wasActive = [TRIP_STATUS.DISPATCHED, TRIP_STATUS.IN_PROGRESS].includes(trip.status);

    const updated = await prisma.$transaction(async (tx) => {
      if (wasActive && trip.vehicleId) {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VEHICLE_STATUS.AVAILABLE },
        });
      }
      if (wasActive && trip.driverId) {
        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: DRIVER_STATUS.AVAILABLE },
        });
      }
      return tx.trip.update({
        where: { id: tripId },
        data: { status: TRIP_STATUS.CANCELLED },
        include: tripInclude,
      });
    });

    return NextResponse.json(serializeTrip(updated));
  } catch (error) {
    console.error("POST /api/trips/[id]/cancel", error);
    return NextResponse.json({ error: "Failed to cancel trip." }, { status: 500 });
  }
}
