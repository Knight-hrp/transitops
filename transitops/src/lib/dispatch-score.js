import { toNumber } from "./constants";

const MAINTENANCE_ODOMETER_THRESHOLD = 10000;

export function scoreVehicleForDispatch(vehicle, cargoWeight, activeMaintenance) {
  const capacity = toNumber(vehicle.maxLoadCapacity);
  const odometer = toNumber(vehicle.odometer);
  const acquisitionCost = toNumber(vehicle.acquisitionCost);
  const weight = Number(cargoWeight) || 0;

  const reasons = [];
  let score = 0;

  if (vehicle.status !== "Available") {
    return { vehicle, score: -1, reasons: ["Not available"], eligible: false };
  }

  if (activeMaintenance) {
    return {
      vehicle,
      score: -1,
      reasons: ["Active maintenance in progress"],
      eligible: false,
    };
  }

  if (weight > capacity) {
    return {
      vehicle,
      score: -1,
      reasons: [`Capacity ${capacity} kg is below cargo ${weight} kg`],
      eligible: false,
    };
  }

  const utilization = weight / capacity;
  if (utilization >= 0.5 && utilization <= 1) {
    score += 40;
    reasons.push(`Capacity suitable for ${weight} kg cargo`);
  } else if (utilization > 0 && utilization < 0.5) {
    score += 20;
    reasons.push(`Can carry ${weight} kg (underutilized)`);
  }

  const costScore = Math.max(0, 25 - Math.floor(acquisitionCost / 100000));
  score += costScore;
  if (costScore >= 15) reasons.push("Lower estimated operating cost");

  const mileageScore = Math.max(0, 20 - Math.floor(odometer / 15000));
  score += mileageScore;
  if (mileageScore >= 10) reasons.push("Lower mileage");

  const maintenanceRisk = odometer % MAINTENANCE_ODOMETER_THRESHOLD;
  if (maintenanceRisk < 2000) {
    score -= 15;
    reasons.push("Maintenance may be due soon");
  } else {
    score += 15;
    reasons.push("No maintenance due soon");
  }

  score += 10;
  reasons.push("Currently available");

  return {
    vehicle,
    score,
    reasons,
    eligible: true,
  };
}

export function rankVehiclesForDispatch(vehicles, cargoWeight, maintenanceByVehicleId = {}) {
  return vehicles
    .map((vehicle) =>
      scoreVehicleForDispatch(
        vehicle,
        cargoWeight,
        maintenanceByVehicleId[vehicle.id],
      ),
    )
    .filter((entry) => entry.eligible)
    .sort((a, b) => b.score - a.score);
}
