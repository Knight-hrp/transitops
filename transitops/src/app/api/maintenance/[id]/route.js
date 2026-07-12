import pool from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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
        UPDATE maintenance_logs
        SET vehicle_id = $1,
            maintenance_type = $2,
            description = $3,
            cost = $4,
            status = $5,
            start_date = $6,
            end_date = $7
        WHERE id = $8
        RETURNING id, maintenance_type AS "maintenanceType", description, cost, status, start_date AS "startDate", end_date AS "endDate"
      `,
      [vehicleId, maintenanceType.trim(), description?.trim() || null, Number(cost), status || "Pending", startDate, endDate || null, Number(id)]
    );

    if (result.rows.length === 0) {
      return Response.json({ success: false, message: "Maintenance record not found." }, { status: 404 });
    }

    return Response.json({ success: true, maintenance: result.rows[0], message: "Maintenance updated successfully." });
  } catch (error) {
    console.error("Maintenance update error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update maintenance record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const result = await pool.query("DELETE FROM maintenance_logs WHERE id = $1 RETURNING id", [Number(id)]);

    if (result.rows.length === 0) {
      return Response.json({ success: false, message: "Maintenance record not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Maintenance deleted successfully." });
  } catch (error) {
    console.error("Maintenance delete error:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to delete maintenance record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
