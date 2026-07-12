import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Prevent idle client errors from crashing the Next.js process
pool.on("error", (err) => {
    console.error("Unexpected pg pool connection error:", err);
});

export default pool;