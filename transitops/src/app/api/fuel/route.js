import pool from "@/lib/db";

const VEHICLE_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

function validateVehicleName(vehicleName, errors) {
  const trimmed = typeof vehicleName === "string" ? vehicleName.trim() : "";
  if (!trimmed) {
    errors.vehicleName = "Vehicle name is required.";
  } else if (trimmed.length > 100) {
    errors.vehicleName = "Vehicle name must be 100 characters or less.";
  } else if (!VEHICLE_NAME_PATTERN.test(trimmed)) {
    errors.vehicleName = "Vehicle name may only contain letters, numbers, spaces, hyphens, and underscores.";
  }

  return trimmed;
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        fl.id,
        v.id AS "vehicleId",
        v.vehicle_name AS vehicle,
        fl.driver,
        fl.liters,
        fl.cost,
        fl.date
      FROM fuel_logs fl
      LEFT JOIN vehicles v ON fl.vehicle_id = v.id
      ORDER BY fl.date DESC, fl.id DESC
    `);

    return Response.json({ success: true, fuelLogs: result.rows });
  } catch (error) {
    console.error("Fuel fetch error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch fuel records",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return Response.json({ success: false, message: "Invalid request body", error: error.message }, { status: 400 });
    }

    const { vehicleId, driver, liters, cost, date } = body || {};
    const errors = {};
    const parsedVehicleId = Number(vehicleId || 0);

    if (!parsedVehicleId || Number.isNaN(parsedVehicleId)) {
      errors.vehicleId = "Please select a valid vehicle.";
    }

    if (!driver || !driver.trim()) {
      errors.driver = "Driver is required.";
    }
    if (!liters || Number(liters) <= 0) {
      errors.liters = "Liters must be greater than zero.";
    }
    if (cost === undefined || cost === null || Number(cost) < 0) {
      errors.cost = "Cost must be a non-negative number.";
    }
    if (!date) {
      errors.date = "Date is required.";
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ success: false, message: "Validation failed", errors }, { status: 400 });
    }

    const vehicleCheck = await pool.query("SELECT id FROM vehicles WHERE id = $1 LIMIT 1", [parsedVehicleId]);
    if (vehicleCheck.rows.length === 0) {
      return Response.json({ success: false, message: "Vehicle not found." }, { status: 400 });
    }

    const result = await pool.query(
      `
        INSERT INTO fuel_logs (vehicle_id, driver, liters, cost, date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [parsedVehicleId, driver.trim(), Number(liters), Number(cost), date]
    );

    return Response.json({ success: true, fuelLog: { id: result.rows[0].id }, message: "Fuel log created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Fuel create error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to create fuel record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
