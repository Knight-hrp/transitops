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

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const role = await getUserRole();

        if (role !== "Fleet Manager" && role !== "Safety Officer") {
            return Response.json({ success: false, message: "Unauthorized to edit driver records" }, { status: 403 });
        }

        const body = await request.json();
        if (!body) {
            throw new Error("Failed to read input: Request body is empty");
        }

        const driverId = Number(id);

        if (role === "Fleet Manager") {
            // Fleet Managers edit name, contactNumber, licenseCategory, licenseExpiryDate
            const { name, contactNumber, licenseCategory, licenseExpiryDate } = body;

            const validName = validateField(name, "Driver Name", 100, true);
            const validCategory = licenseCategory ? validateField(licenseCategory, "License Category", 50, true) : null;

            if (!licenseExpiryDate) {
                throw new Error("License Expiry Date is required");
            }
            const expiryDate = new Date(licenseExpiryDate);
            if (isNaN(expiryDate.getTime())) {
                throw new Error("License Expiry Date must be a valid date");
            }

            if (contactNumber) {
                const phone = String(contactNumber).trim();
                if (!/^\+?[0-9\s\-]{6,20}$/.test(phone)) {
                    throw new Error("Contact Number can only contain digits, spaces, hyphens, and optional '+' prefix (6-20 characters)");
                }
            }

            const result = await pool.query(
                `
                UPDATE drivers
                SET name = $1,
                    contact_number = $2,
                    license_category = $3,
                    license_expiry_date = $4
                WHERE id = $5
                RETURNING id, name, license_number AS "licenseNumber", license_category AS "licenseCategory", license_expiry_date AS "licenseExpiryDate", contact_number AS "contactNumber", safety_score AS "safetyScore", status
                `,
                [validName, contactNumber || null, validCategory, expiryDate, driverId]
            );

            if (result.rows.length === 0) {
                return Response.json({ success: false, message: "Driver not found" }, { status: 404 });
            }

            return Response.json({ success: true, driver: result.rows[0], message: "Driver details updated successfully" });
        }

        if (role === "Safety Officer") {
            // Safety Officers edit safetyScore, status (e.g. Suspend or change status)
            const { safetyScore, status } = body;

            const score = Number(safetyScore);
            if (isNaN(score) || score < 0 || score > 100) {
                throw new Error("Safety Score must be a number between 0 and 100");
            }

            const validStatus = validateField(status, "Status", 30, true);
            if (validStatus !== "Available" && validStatus !== "On Trip" && validStatus !== "Suspended") {
                throw new Error("Invalid status option. Must be Available, On Trip, or Suspended.");
            }

            const result = await pool.query(
                `
                UPDATE drivers
                SET safety_score = $1,
                    status = $2
                WHERE id = $3
                RETURNING id, name, license_number AS "licenseNumber", license_category AS "licenseCategory", license_expiry_date AS "licenseExpiryDate", contact_number AS "contactNumber", safety_score AS "safetyScore", status
                `,
                [score, validStatus, driverId]
            );

            if (result.rows.length === 0) {
                return Response.json({ success: false, message: "Driver not found" }, { status: 404 });
            }

            return Response.json({ success: true, driver: result.rows[0], message: "Driver safety and status updated successfully" });
        }

    } catch (error) {
        console.error("Driver update error:", error);
        return Response.json(
            {
                success: false,
                message: error.message || "Failed to update driver details",
            },
            { status: 400 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const role = await getUserRole();

        if (role !== "Fleet Manager") {
            return Response.json({ success: false, message: "Only Fleet Managers can delete driver records" }, { status: 403 });
        }

        const result = await pool.query(
            "DELETE FROM drivers WHERE id = $1 RETURNING id",
            [Number(id)]
        );

        if (result.rows.length === 0) {
            return Response.json({ success: false, message: "Driver not found" }, { status: 404 });
        }

        return Response.json({ success: true, message: "Driver deleted successfully" });
    } catch (error) {
        console.error("Driver delete error:", error);
        return Response.json(
            {
                success: false,
                message: "Failed to delete driver. Ensure they are not currently assigned to active trips.",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
