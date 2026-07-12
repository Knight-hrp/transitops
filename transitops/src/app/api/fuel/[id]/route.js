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

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

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
        UPDATE fuel_logs
        SET vehicle_id = $1,
            driver = $2,
            liters = $3,
            cost = $4,
            date = $5
        WHERE id = $6
        RETURNING id
      `,
      [parsedVehicleId, driver.trim(), Number(liters), Number(cost), date, Number(id)]
    );

    if (result.rows.length === 0) {
      return Response.json({ success: false, message: "Fuel log not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Fuel log updated successfully." });
  } catch (error) {
    console.error("Fuel update error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to update fuel record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await pool.query("DELETE FROM fuel_logs WHERE id = $1 RETURNING id", [Number(id)]);

    if (result.rows.length === 0) {
      return Response.json({ success: false, message: "Fuel log not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Fuel log deleted successfully." });
  } catch (error) {
    console.error("Fuel delete error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to delete fuel record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
