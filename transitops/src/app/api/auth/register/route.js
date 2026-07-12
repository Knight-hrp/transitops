import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
    try {
        const body = await request.json();

        const { name, email, password, role_id } = body;

        // Basic validation
        if (!name || !email || !password || !role_id) {
            return Response.json(
                {
                    success: false,
                    message: "All fields are required",
                },
                { status: 400 }
            );
        }

        // Check whether user already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return Response.json(
                {
                    success: false,
                    message: "User already exists",
                },
                { status: 409 }
            );
        }

        // Check whether role exists
        const roleResult = await pool.query(
            "SELECT id FROM roles WHERE id = $1",
            [role_id]
        );

        if (roleResult.rows.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid role",
                },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await pool.query(
            `
        INSERT INTO users (name, email, password, role_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role_id, created_at
      `,
            [name, email.toLowerCase(), hashedPassword, role_id]
        );

        return Response.json(
            {
                success: true,
                message: "User registered successfully",
                user: result.rows[0],
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);

        return Response.json(
            {
                success: false,
                message: "Registration failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}