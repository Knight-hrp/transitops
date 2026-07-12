import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        e.id,
        e.vehicle_id AS "vehicleId",
        v.vehicle_name AS vehicle,
        e.expense_type AS "expenseType",
        e.amount,
        e.description,
        e.date
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      ORDER BY e.date DESC, e.id DESC
    `);

    return Response.json({ success: true, expenses: result.rows });
  } catch (error) {
    console.error("Expense fetch error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch expense records",
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

    const { vehicleId, expenseType, amount, description, date } = body || {};
    const errors = {};
    const parsedVehicleId = Number(vehicleId || 0);

    if (!parsedVehicleId || Number.isNaN(parsedVehicleId)) {
      errors.vehicleId = "Please select a valid vehicle.";
    }

    if (!expenseType || !expenseType.trim()) {
      errors.expenseType = "Expense type is required.";
    }

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      errors.amount = "Amount must be greater than zero.";
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

    const duplicateCheck = await pool.query(
      `SELECT id FROM expenses WHERE vehicle_id = $1 AND LOWER(expense_type) = LOWER($2) LIMIT 1`,
      [parsedVehicleId, expenseType.trim()]
    );
    if (duplicateCheck.rows.length > 0) {
      return Response.json(
        {
          success: false,
          message: "This expense type has already been recorded for the selected vehicle.",
          errors: { expenseType: "This expense type has already been recorded for this vehicle." },
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO expenses (vehicle_id, expense_type, amount, description, date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
      [parsedVehicleId, expenseType.trim(), Number(amount), description?.trim() || null, date]
    );

    return Response.json({ success: true, expense: { id: result.rows[0].id }, message: "Expense created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Expense create error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to create expense record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
