import pool from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

// Helper input validation function
function validateField(value, fieldName, maxLength = 100, allowSpace = false) {
    if (value === undefined || value === null) {
        throw new Error(`Failed to read input: ${fieldName} is missing`);
    }

    const str = String(value).trim();

    // 1. Cannot enter blank space (empty or only whitespace)
    if (!str) {
        throw new Error(`${fieldName} cannot be empty or consist only of whitespace`);
    }

    // 2. Should not be longer than 100 char
    if (str.length > maxLength) {
        throw new Error(`${fieldName} cannot be longer than ${maxLength} characters`);
    }

    // 3. Cannot enter symbols (only letters, numbers, hyphens, and optional single space allowed)
    const regex = allowSpace 
        ? /^[a-zA-Z0-9\-_]+(?:\s[a-zA-Z0-9\-_]+)*$/ 
        : /^[a-zA-Z0-9\-_]+$/;

    if (!regex.test(str)) {
        if (allowSpace) {
            throw new Error(`${fieldName} can only contain letters, numbers, hyphens, underscores, and single spaces between words (no special symbols allowed)`);
        } else {
            throw new Error(`${fieldName} can only contain letters, numbers, hyphens, and underscores (no spaces or special symbols allowed)`);
        }
    }

    return str;
}

// Get user role from request cookies
async function getUserRole() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return null;

        const payload = await verifyToken(token);
        return payload ? payload.role : null;
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const role = await getUserRole();
        if (!role || role === "Financial Analyst") {
            return Response.json({ success: false, message: "Unauthorized access" }, { status: 403 });
        }

        const result = await pool.query(`
            SELECT 
                id,
                name,
                license_number AS "licenseNumber",
                license_category AS "licenseCategory",
                license_expiry_date AS "licenseExpiryDate",
                contact_number AS "contactNumber",
                safety_score AS "safetyScore",
                status,
                created_at AS "createdAt"
            FROM drivers
            ORDER BY name ASC, id DESC
        `);

        return Response.json({
            success: true,
            drivers: result.rows,
        });
    } catch (error) {
        console.error("Drivers fetch error:", error);
        return Response.json(
            {
                success: false,
                message: "Failed to fetch driver records",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const role = await getUserRole();
        // Only Fleet Manager can create/add drivers
        if (role !== "Fleet Manager") {
            return Response.json({ success: false, message: "Only Fleet Managers can register new drivers" }, { status: 403 });
        }

        const body = await request.json();
        if (!body) {
            throw new Error("Failed to read input: Request body is empty");
        }

        const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber } = body;

        // Perform validations and throw exceptions if constraints are violated
        const validName = validateField(name, "Driver Name", 100, true);
        const validLicense = validateField(licenseNumber, "License Number", 100, false);
        const validCategory = licenseCategory ? validateField(licenseCategory, "License Category", 50, true) : null;

        if (!licenseExpiryDate) {
            throw new Error("License Expiry Date is required");
        }
        const expiryDate = new Date(licenseExpiryDate);
        if (isNaN(expiryDate.getTime())) {
            throw new Error("License Expiry Date must be a valid date");
        }

        // Simple validation for phone number (digits, spaces, hyphens, optional + prefix)
        if (contactNumber) {
            const phone = String(contactNumber).trim();
            if (!/^\+?[0-9\s\-]{6,20}$/.test(phone)) {
                throw new Error("Contact Number can only contain digits, spaces, hyphens, and optional '+' prefix (6-20 characters)");
            }
        }

        // Check if license number already exists in DB
        const existingLicense = await pool.query(
            "SELECT id FROM drivers WHERE license_number = $1 LIMIT 1",
            [validLicense.toUpperCase()]
        );
        if (existingLicense.rows.length > 0) {
            throw new Error(`Driver with license number '${validLicense.toUpperCase()}' already exists`);
        }

        // Insert new driver
        const result = await pool.query(
            `
            INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
            VALUES ($1, $2, $3, $4, $5, 100.0, 'Available')
            RETURNING id, name, license_number AS "licenseNumber", license_category AS "licenseCategory", license_expiry_date AS "licenseExpiryDate", contact_number AS "contactNumber", safety_score AS "safetyScore", status
            `,
            [validName, validLicense.toUpperCase(), validCategory, expiryDate, contactNumber || null]
        );

        return Response.json({
            success: true,
            driver: result.rows[0],
            message: "Driver registered successfully.",
        }, { status: 201 });

    } catch (error) {
        console.error("Driver create error:", error);
        return Response.json(
            {
                success: false,
                message: error.message || "Failed to register driver",
            },
            { status: 400 }
        );
    }
}
