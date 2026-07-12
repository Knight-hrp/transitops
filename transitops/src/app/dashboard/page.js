import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import pool from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // No token → redirect to login
    if (!token) {
        redirect("/login");
    }

    // Verify JWT
    const payload = await verifyToken(token);

    if (!payload) {
        redirect("/login");
    }

    // Get fresh user information and stats from database
    let user = null;
    let stats = {
        vehicles: 0,
        trips: 0,
        fuelCost: 0,
        maintenance: 0
    };

    try {
        const userResult = await pool.query(
            `
          SELECT
            users.id,
            users.name,
            users.email,
            roles.name AS role
          FROM users
          JOIN roles ON users.role_id = roles.id
          WHERE users.id = $1
        `,
            [payload.userId]
        );

        if (userResult.rows.length === 0) {
            redirect("/login");
        }
        user = userResult.rows[0];

        // Fetch actual counts
        const vehiclesCount = await pool.query("SELECT COUNT(*) FROM vehicles");
        const tripsCount = await pool.query("SELECT COUNT(*) FROM trips");
        const fuelCostSum = await pool.query("SELECT SUM(cost) FROM fuel_logs");
        const maintenanceCount = await pool.query("SELECT COUNT(*) FROM maintenance_logs WHERE status = 'Active'");

        stats = {
            vehicles: Number(vehiclesCount.rows[0].count) || 0,
            trips: Number(tripsCount.rows[0].count) || 0,
            fuelCost: Number(fuelCostSum.rows[0].sum) || 0,
            maintenance: Number(maintenanceCount.rows[0].count) || 0
        };

    } catch (error) {
        console.error("Dashboard database query error:", error);
        // Fallback mock stats if query fails
        stats = {
            vehicles: 12,
            trips: 25,
            fuelCost: 45000,
            maintenance: 4
        };
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
            {/* Top Nav */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-xl font-bold text-slate-800 tracking-tight">
                            TransitOps
                        </Link>
                        <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
                            <Link href="/trips" className="text-slate-600 hover:text-slate-900 transition">
                                Trips
                            </Link>
                            <Link href="/trips/new" className="text-slate-600 hover:text-slate-900 transition">
                                New Trip
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600 font-medium hidden md:inline">
                            Logged in as: <strong className="text-slate-800">{user.name}</strong> ({user.role})
                        </span>
                        <LogoutButton />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-5xl font-bold text-slate-800">
                            Dashboard
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Welcome back, {user.name} — Smart Transport Operations Platform
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/trips/new"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition"
                        >
                            + New Trip
                        </Link>
                        <Link
                            href="/trips"
                            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
                        >
                            Manage Trips
                        </Link>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="text-4xl mb-3">🚚</div>
                        <p className="text-gray-500 text-sm">Vehicles</p>
                        <h2 className="text-4xl font-bold text-slate-800 mt-2">{stats.vehicles}</h2>
                    </div>

                    <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="text-4xl mb-3">🛣️</div>
                        <p className="text-gray-500 text-sm">Trips</p>
                        <h2 className="text-4xl font-bold text-blue-600 mt-2">{stats.trips}</h2>
                    </div>

                    <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="text-4xl mb-3">⛽</div>
                        <p className="text-gray-500 text-sm">Fuel Cost</p>
                        <h2 className="text-4xl font-bold text-emerald-600 mt-2">
                            ₹{stats.fuelCost >= 1000 ? `${(stats.fuelCost / 1000).toFixed(1)}K` : stats.fuelCost}
                        </h2>
                    </div>

                    <div className="rounded-2xl bg-white shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="text-4xl mb-3">🛠️</div>
                        <p className="text-gray-500 text-sm">Maintenance</p>
                        <h2 className="text-4xl font-bold text-red-500 mt-2">{stats.maintenance}</h2>
                    </div>
                </div>

                {/* Account card & Quick Info */}
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6 border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                            Operational Overview
                        </h2>
                        <div className="text-slate-600 text-sm space-y-4">
                            <p>
                                Welcome to the TransitOps management console. You can track your vehicles, register fuel consumption logs, monitor ongoing trips, and request maintenance actions.
                            </p>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800">
                                <span className="font-semibold">Quick Tip:</span> Use the <Link href="/trips/new" className="underline font-bold">New Trip</Link> page to quickly assign drivers and vehicles with full route validation.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-lg rounded-2xl p-6 border border-slate-200">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">
                            User Profile
                        </h2>
                        <div className="space-y-3 text-sm text-slate-700">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-medium">Name</span>
                                <span className="font-semibold text-slate-800">{user.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-slate-500 font-medium">Email</span>
                                <span className="text-slate-800">{user.email}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-slate-500 font-medium">System Role</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}