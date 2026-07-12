import pool from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

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
      `SELECT id FROM expenses WHERE vehicle_id = $1 AND LOWER(expense_type) = LOWER($2) AND id != $3 LIMIT 1`,
      [parsedVehicleId, expenseType.trim(), Number(id)]
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
        UPDATE expenses
        SET vehicle_id = $1,
            expense_type = $2,
            amount = $3,
            description = $4,
            date = $5
        WHERE id = $6
        RETURNING id
      `,
      [parsedVehicleId, expenseType.trim(), Number(amount), description?.trim() || null, date, Number(id)]
    );

    if (result.rows.length === 0) {
      return Response.json({ success: false, message: "Expense record not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Expense updated successfully." });
  } catch (error) {
    console.error("Expense update error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to update expense record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const result = await pool.query("DELETE FROM expenses WHERE id = $1 RETURNING id", [Number(id)]);

    if (result.rows.length === 0) {
      return Response.json({ success: false, message: "Expense record not found." }, { status: 404 });
    }

    return Response.json({ success: true, message: "Expense deleted successfully." });
  } catch (error) {
    console.error("Expense delete error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to delete expense record",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
