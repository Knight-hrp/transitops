import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeVehicle } from "@/lib/constants";
import { rankVehiclesForDispatch } from "@/lib/dispatch-score";
import { requireRole } from "@/lib/api-auth";

const TRIP_ROLES = ["Dispatcher"];

export async function GET(request) {
  try {
    const { error } = await requireRole(TRIP_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const cargoWeight = searchParams.get("cargoWeight");

    if (!cargoWeight || Number(cargoWeight) <= 0) {
      return NextResponse.json(
        { error: "cargoWeight query parameter is required." },
        { status: 400 },
      );
    }

    const vehicles = await prisma.vehicle.findMany({
      where: { status: "Available" },
      orderBy: { vehicleName: "asc" },
    });

    const maintenanceLogs = await prisma.maintenanceLog.findMany({
      where: { status: "Active" },
      select: { vehicleId: true },
    });

    const maintenanceByVehicleId = Object.fromEntries(
      maintenanceLogs.map((log) => [log.vehicleId, true]),
    );

    const ranked = rankVehiclesForDispatch(
      vehicles,
      cargoWeight,
      maintenanceByVehicleId,
    ).map((entry) => ({
      ...entry,
      vehicle: serializeVehicle(entry.vehicle),
    }));

    const recommendation = ranked[0] ?? null;

    return NextResponse.json({
      cargoWeight: Number(cargoWeight),
      recommendation: recommendation
        ? {
            vehicle: recommendation.vehicle,
            score: recommendation.score,
            reasons: recommendation.reasons,
          }
        : null,
      alternatives: ranked.slice(1, 4).map((entry) => ({
        vehicle: entry.vehicle,
        score: entry.score,
        reasons: entry.reasons,
      })),
    });
  } catch (error) {
    console.error("GET /api/trips/recommend", error);
    return NextResponse.json(
      { error: "Failed to compute dispatch recommendation." },
      { status: 500 },
    );
  }
}
