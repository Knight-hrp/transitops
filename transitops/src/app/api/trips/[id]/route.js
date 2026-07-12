import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTrip } from "@/lib/constants";

const tripInclude = {
  vehicle: true,
  driver: true,
};

export async function GET(_request, { params }) {
  try {
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
