import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT id, vehicle_name AS \"vehicleName\" FROM vehicles ORDER BY vehicle_name ASC"
    );

    return Response.json({ success: true, vehicles: result.rows });
  } catch (error) {
    console.error("Fuel vehicle fetch error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch vehicles",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
