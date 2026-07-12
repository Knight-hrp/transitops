import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(request) {
    try {
        const body = await request.json();

        const { email, password } = body;

        if (!email || !password) {
            return Response.json(
                {
                    success: false,
                    message: "Email and password are required",
                },
                { status: 400 }
            );
        }

        // Find user and their role
        const result = await pool.query(
            `
        SELECT
          users.id,
          users.name,
          users.email,
          users.password,
          roles.id AS role_id,
          roles.name AS role
        FROM users
        JOIN roles ON users.role_id = roles.id
        WHERE users.email = $1
      `,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid email or password",
                },
                { status: 401 }
            );
        }

        const user = result.rows[0];

        // Compare password
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid email or password",
                },
                { status: 401 }
            );
        }

        // Create JWT
        const token = await createToken({
            userId: user.id,
            email: user.email,
            roleId: user.role_id,
            role: user.role,
        });

        const response = Response.json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

        // Store JWT in HttpOnly cookie
        response.headers.append(
            "Set-Cookie",
            `token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""
            }`
        );

        return response;
    } catch (error) {
        console.error("Login error:", error);

        return Response.json(
            {
                success: false,
                message: "Login failed",
                error: error.message,
            },
            { status: 500 }
        );
    }
}