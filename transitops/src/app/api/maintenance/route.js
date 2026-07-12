import pool from "@/lib/db";

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
    const body = await request.json();
    const { vehicleName, maintenanceType, description, cost, status, startDate, endDate } = body;

    const errors = {};

    if (!vehicleName || !vehicleName.trim()) {
      errors.vehicleName = "Vehicle is required.";
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

    const vehicleResult = await pool.query(
      "SELECT id FROM vehicles WHERE vehicle_name = $1 LIMIT 1",
      [vehicleName.trim()]
    );

    if (vehicleResult.rows.length === 0) {
      return Response.json(
        { success: false, message: "Vehicle not found. Please select a valid vehicle name." },
        { status: 400 }
      );
    }

    const vehicleId = vehicleResult.rows[0].id;

    const result = await pool.query(
      `
        INSERT INTO maintenance_logs (vehicle_id, maintenance_type, description, cost, status, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, maintenance_type AS "maintenanceType", description, cost, status, start_date AS "startDate", end_date AS "endDate"
      `,
      [vehicleId, maintenanceType.trim(), description?.trim() || null, Number(cost), status || "Pending", startDate, endDate || null]
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
