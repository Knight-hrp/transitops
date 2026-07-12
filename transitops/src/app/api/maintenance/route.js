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
        ml.id,
        ml.maintenance_type AS "maintenanceType",
        ml.description,
        ml.cost,
        ml.status,
        ml.start_date AS "startDate",
        ml.end_date AS "endDate",
        v.id AS "vehicleId",
        v.vehicle_name AS vehicle
      FROM maintenance_logs ml
      LEFT JOIN vehicles v ON ml.vehicle_id = v.id
      ORDER BY ml.start_date DESC, ml.id DESC
    `);

    return Response.json({
      success: true,
      maintenance: result.rows,
    });
  } catch (error) {
    console.error("Maintenance fetch error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to fetch maintenance records",
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

    const { vehicleId, maintenanceType, description, cost, status, startDate, endDate } = body || {};

    const errors = {};
    const parsedVehicleId = Number(vehicleId || 0);

    if (!parsedVehicleId || Number.isNaN(parsedVehicleId)) {
      errors.vehicleId = "Please select a valid vehicle.";
    }

    if (!maintenanceType || !maintenanceType.trim()) {
      errors.maintenanceType = "Maintenance type is required.";
    }

    if (!cost || Number(cost) <= 0) {
      errors.cost = "Cost must be greater than zero.";
    }

    if (!startDate) {
      errors.startDate = "Start date is required.";
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ success: false, message: "Validation failed", errors }, { status: 400 });
    }

    const vehicleCheck = await pool.query("SELECT id FROM vehicles WHERE id = $1 LIMIT 1", [parsedVehicleId]);
    if (vehicleCheck.rows.length === 0) {
      return Response.json({ success: false, message: "Vehicle not found." }, { status: 400 });
    }

    const dup = await pool.query(
      "SELECT id FROM maintenance_logs WHERE vehicle_id = $1 AND (status IS NULL OR status != 'Completed') LIMIT 1",
      [parsedVehicleId]
    );
    if (dup.rows.length > 0) {
      return Response.json({ success: false, message: "An active maintenance record already exists for this vehicle." }, { status: 400 });
    }

    const result = await pool.query(
      `
        INSERT INTO maintenance_logs (vehicle_id, maintenance_type, description, cost, status, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, maintenance_type AS "maintenanceType", description, cost, status, start_date AS "startDate", end_date AS "endDate"
      `,
      [parsedVehicleId, maintenanceType.trim(), description?.trim() || null, Number(cost), status || "Pending", startDate, endDate || null]
    );

    return Response.json({ success: true, maintenance: result.rows[0], message: "Maintenance created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Maintenance create error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create maintenance record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
