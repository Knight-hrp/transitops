import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return Response.json(
                {
                    success: false,
                    message: "Not authenticated",
                },
                { status: 401 }
            );
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid or expired token",
                },
                { status: 401 }
            );
        }

        const result = await pool.query(
            `
        SELECT
          users.id,
          users.name,
          users.email,
          roles.id AS role_id,
          roles.name AS role
        FROM users
        JOIN roles ON users.role_id = roles.id
        WHERE users.id = $1
      `,
            [payload.userId]
        );

        if (result.rows.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "User not found",
                },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Get current user error:", error);

        return Response.json(
            {
                success: false,
                message: "Failed to get current user",
                error: error.message,
            },
            { status: 500 }
        );
    }
}