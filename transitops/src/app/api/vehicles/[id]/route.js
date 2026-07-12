import pool from "@/lib/db";

// Helper input validation function
function validateField(value, fieldName, maxLength = 100, allowSpace = false) {
    if (value === undefined || value === null) {
        throw new Error(`Failed to read input: ${fieldName} is missing`);
    }

    const str = String(value);

    // 1. Cannot enter blank space (empty or only whitespace)
    if (!str || str.trim() === "") {
        throw new Error(`${fieldName} cannot be empty or consist only of whitespace`);
    }

    // Check for leading/trailing spaces
    if (str !== str.trim()) {
        throw new Error(`${fieldName} cannot have leading or trailing spaces`);
    }

    // 2. Should not be longer than 100 char
    if (str.length > maxLength) {
        throw new Error(`${fieldName} cannot be longer than ${maxLength} characters`);
    }

    // 3. Cannot enter symbols (only letters, numbers, hyphens, underscores, and optional single space allowed)
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

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        if (!body) {
            throw new Error("Failed to read input: Request body is empty");
        }

        const { registrationNumber, vehicleName, type, maxLoadCapacity, odometer, acquisitionCost, status, region } = body;

        // Perform validations and throw exceptions if constraints are violated
        const validReg = validateField(registrationNumber, "Registration Number", 50, false);
        const validName = validateField(vehicleName, "Vehicle Name", 100, true);
        const validType = validateField(type, "Vehicle Type", 50, true);
        const validStatus = validateField(status, "Status", 30, true);

        // Numeric constraints validation
        const load = Number(maxLoadCapacity);
        if (isNaN(load) || load <= 0) {
            throw new Error("Max Load Capacity must be a positive number");
        }

        const odo = Number(odometer);
        if (isNaN(odo) || odo < 0) {
            throw new Error("Odometer must be a non-negative number");
        }

        const cost = Number(acquisitionCost);
        if (isNaN(cost) || cost < 0) {
            throw new Error("Acquisition Cost must be a non-negative number");
        }

        const cleanRegion = region ? validateField(region, "Region", 100, true) : null;

        // Check if registration number already exists on another vehicle in DB
        const existingReg = await pool.query(
            "SELECT id FROM vehicles WHERE registration_number = $1 AND id != $2 LIMIT 1",
            [validReg.toUpperCase(), Number(id)]
        );
        if (existingReg.rows.length > 0) {
            throw new Error(`Another vehicle with registration number '${validReg.toUpperCase()}' already exists`);
        }

        // Format name to guarantee the unique ID suffix
        let baseName = validName;
        const suffix = `_${id}`;
        if (baseName.endsWith(suffix)) {
            baseName = baseName.slice(0, -suffix.length);
        }
        const uniqueName = `${baseName}${suffix}`;

        // Update vehicle
        const result = await pool.query(
            `
            UPDATE vehicles
            SET registration_number = $1,
                vehicle_name = $2,
                type = $3,
                max_load_capacity = $4,
                odometer = $5,
                acquisition_cost = $6,
                status = $7,
                region = $8
            WHERE id = $9
            RETURNING id, registration_number AS "registrationNumber", vehicle_name AS "vehicleName", type, max_load_capacity AS "maxLoadCapacity", odometer, acquisition_cost AS "acquisitionCost", status, region
            `,
            [validReg.toUpperCase(), uniqueName, validType, load, odo, cost, validStatus, cleanRegion, Number(id)]
        );

        if (result.rows.length === 0) {
            return Response.json({ success: false, message: "Vehicle record not found." }, { status: 404 });
        }

        return Response.json({
            success: true,
            vehicle: result.rows[0],
            message: "Vehicle updated successfully.",
        });

    } catch (error) {
        console.error("Vehicle update error:", error);
        return Response.json(
            {
                success: false,
                message: error.message || "Failed to update vehicle record",
            },
            { status: 400 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        // Perform delete check
        const result = await pool.query(
            "DELETE FROM vehicles WHERE id = $1 RETURNING id",
            [Number(id)]
        );

        if (result.rows.length === 0) {
            return Response.json({ success: false, message: "Vehicle record not found." }, { status: 404 });
        }

        return Response.json({
            success: true,
            message: "Vehicle deleted successfully.",
        });
    } catch (error) {
        console.error("Vehicle delete error:", error);
        return Response.json(
            {
                success: false,
                message: "Failed to delete vehicle record. Ensure it is not referenced in active trips or maintenance logs.",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
