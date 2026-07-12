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

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                registration_number AS "registrationNumber",
                vehicle_name AS "vehicleName",
                type,
                max_load_capacity AS "maxLoadCapacity",
                odometer,
                acquisition_cost AS "acquisitionCost",
                status,
                region
            FROM vehicles
            ORDER BY vehicle_name ASC, id DESC
        `);

        return Response.json({
            success: true,
            vehicles: result.rows,
        });
    } catch (error) {
        console.error("Vehicles fetch error:", error);
        return Response.json(
            {
                success: false,
                message: "Failed to fetch vehicle records",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
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

        // Check if registration number already exists in DB
        const existingReg = await pool.query(
            "SELECT id FROM vehicles WHERE registration_number = $1 LIMIT 1",
            [validReg.toUpperCase()]
        );
        if (existingReg.rows.length > 0) {
            throw new Error(`Vehicle with registration number '${validReg.toUpperCase()}' already exists`);
        }

        // Insert new vehicle (first with the raw name)
        const result = await pool.query(
            `
            INSERT INTO vehicles (registration_number, vehicle_name, type, max_load_capacity, odometer, acquisition_cost, status, region)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, registration_number AS "registrationNumber", vehicle_name AS "vehicleName", type, max_load_capacity AS "maxLoadCapacity", odometer, acquisition_cost AS "acquisitionCost", status, region
            `,
            [validReg.toUpperCase(), validName, validType, load, odo, cost, validStatus, cleanRegion]
        );

        const newVehicle = result.rows[0];
        const uniqueName = `${validName}_${newVehicle.id}`;

        // Update the vehicle name to include the unique ID suffix
        await pool.query(
            "UPDATE vehicles SET vehicle_name = $1 WHERE id = $2",
            [uniqueName, newVehicle.id]
        );

        newVehicle.vehicleName = uniqueName;

        return Response.json({
            success: true,
            vehicle: newVehicle,
            message: "Vehicle registered successfully.",
        }, { status: 201 });

    } catch (error) {
        console.error("Vehicle create error:", error);
        return Response.json(
            {
                success: false,
                message: error.message || "Failed to create vehicle record",
            },
            { status: 400 } // Send 400 Bad Request since the exceptions are validation / user errors
        );
    }
}
