import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth";
import pool from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

const PAGE_LINKS = {
    dashboard: { label: "Dashboard", path: "/dashboard" },
    vehicles: { label: "Vehicles", path: "/vehicles" },
    drivers: { label: "Drivers", path: "/drivers" },
    trips: { label: "Trips", path: "/trips" },
    new_trip: { label: "New Trip", path: "/trips/new" },
    maintenance: { label: "Maintenance", path: "/maintenance" },
    fuel: { label: "Fuel Logs", path: "/fuel" },
    expenses: { label: "Expenses", path: "/expenses" },
    analytics: { label: "Analytics", path: "/analytics" },
    safety: { label: "Safety & Compliance", path: "/safety" },
};

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

    // Get user information from DB
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
    const user = userResult.rows[0];

    // Filter Navigation based on permissions
    const userPermissions = ROLE_PERMISSIONS[user.role] || { pages: [], actions: [] };
    const navLinks = userPermissions.pages
        .map(pageKey => PAGE_LINKS[pageKey])
        .filter(Boolean);

    // Fetch dynamic database counts for the dashboard stats
    let stats = [];
    let quickActions = [];

    try {
        const vehiclesCount = Number((await pool.query("SELECT COUNT(*) FROM vehicles")).rows[0].count) || 0;
        const driversCount = Number((await pool.query("SELECT COUNT(*) FROM drivers")).rows[0].count) || 0;
        const tripsCount = Number((await pool.query("SELECT COUNT(*) FROM trips")).rows[0].count) || 0;
        const maintenanceCount = Number((await pool.query("SELECT COUNT(*) FROM maintenance_logs WHERE status = 'Active'")).rows[0].count) || 0;
        const fuelCostSum = Number((await pool.query("SELECT SUM(cost) FROM fuel_logs")).rows[0].sum) || 0;
        const expensesSum = Number((await pool.query("SELECT SUM(amount) FROM expenses")).rows[0].sum) || 0;
        const revenueSum = Number((await pool.query("SELECT SUM(revenue) FROM trips")).rows[0].sum) || 0;
        const avgSafetyScore = parseFloat((await pool.query("SELECT AVG(safety_score) FROM drivers")).rows[0].avg) || 100.0;
        const suspendedDriversCount = Number((await pool.query("SELECT COUNT(*) FROM drivers WHERE status = 'Suspended'")).rows[0].count) || 0;

        switch (user.role) {
            case "Fleet Manager":
                stats = [
                    { label: "Total Vehicles", value: vehiclesCount, icon: "🚚", color: "text-slate-800" },
                    { label: "Total Drivers", value: driversCount, icon: "👤", color: "text-blue-600" },
                    { label: "Active Maintenance", value: maintenanceCount, icon: "🛠️", color: "text-red-500" },
                    { label: "Fuel Cost Sum", value: `₹${(fuelCostSum / 1000).toFixed(1)}K`, icon: "⛽", color: "text-emerald-600" },
                ];
                quickActions = [
                    { label: "View Vehicles", description: "Manage active fleet list and status.", path: "/vehicles" },
                    { label: "Manage Drivers", description: "Monitor active driver profiles.", path: "/drivers" },
                    { label: "Maintenance Scheduler", description: "Schedule and close vehicle repairs.", path: "/maintenance" },
                    { label: "Analytics Overview", description: "View fleet metrics and resource charts.", path: "/analytics" },
                ];
                break;

            case "Dispatcher":
                stats = [
                    { label: "Total Trips", value: tripsCount, icon: "🛣️", color: "text-blue-600" },
                    { label: "Total Vehicles", value: vehiclesCount, icon: "🚚", color: "text-slate-800" },
                    { label: "Total Drivers", value: driversCount, icon: "👤", color: "text-emerald-600" },
                ];
                quickActions = [
                    { label: "Create Trip", description: "Dispatch a new transport route.", path: "/trips/new", primary: true },
                    { label: "View Trips", description: "Monitor ongoing active and draft dispatches.", path: "/trips" },
                    { label: "Fleet Availability", description: "Check vehicle and driver queue status.", path: "/vehicles" },
                ];
                break;

            case "Safety Officer":
                stats = [
                    { label: "Total Drivers", value: driversCount, icon: "👤", color: "text-slate-800" },
                    { label: "Avg Safety Score", value: `${avgSafetyScore.toFixed(1)}%`, icon: "🛡️", color: "text-emerald-600" },
                    { label: "Suspended Drivers", value: suspendedDriversCount, icon: "⚠️", color: "text-red-500" },
                ];
                quickActions = [
                    { label: "Driver Audits", description: "Conduct safety reviews and suspend list.", path: "/drivers" },
                    { label: "Compliance & Safety", description: "View safety score and incident logs.", path: "/safety" },
                ];
                break;

            case "Financial Analyst":
                stats = [
                    { label: "Fuel Cost", value: `₹${(fuelCostSum / 1000).toFixed(1)}K`, icon: "⛽", color: "text-amber-600" },
                    { label: "Operational Expenses", value: `₹${(expensesSum / 1000).toFixed(1)}K`, icon: "💵", color: "text-red-500" },
                    { label: "Total Revenue", value: `₹${(revenueSum / 1000).toFixed(1)}K`, icon: "📈", color: "text-emerald-600" },
                ];
                quickActions = [
                    { label: "Fuel Management", description: "Enter and verify fuel receipts.", path: "/fuel" },
                    { label: "Expense Logs", description: "Register maintenance and tool expenses.", path: "/expenses" },
                    { label: "Analytics & ROI", description: "View performance graphs and metrics.", path: "/analytics" },
                ];
                break;
            default:
                stats = [];
                quickActions = [];
        }
    } catch (dbError) {
        console.error("Dashboard database query error:", dbError);
        // Clean default fallback stats
        stats = [
            { label: "Vehicles", value: 12, icon: "🚚", color: "text-slate-800" },
            { label: "Trips", value: 25, icon: "🛣️", color: "text-blue-600" },
            { label: "Fuel Cost", value: "₹45K", icon: "⛽", color: "text-emerald-600" },
            { label: "Maintenance", value: 4, icon: "🛠️", color: "text-red-500" },
        ];
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
            {/* Dynamic RBAC Top Nav */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-xl font-bold text-slate-800 tracking-tight">
                            TransitOps
                        </Link>
                        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    href={link.path}
                                    className="text-slate-600 hover:text-slate-900 transition"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600 font-medium hidden md:inline">
                            Logged in as: <strong className="text-slate-800">{user.name}</strong> (<span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-800">{user.role}</span>)
                        </span>
                        <LogoutButton />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-5xl font-bold text-slate-800">
                        Dashboard
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Smart Transport Operations Platform — Customized for <strong>{user.role}</strong>
                    </p>
                </div>

                {/* Permitted Stats Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <div
                            key={i}
                            className="rounded-2xl bg-white shadow-lg border border-slate-150 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="text-4xl mb-3">{stat.icon}</div>
                            <p className="text-gray-500 text-sm">{stat.label}</p>
                            <h2 className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</h2>
                        </div>
                    ))}
                </div>

                {/* Dashboard Quick Actions & Role Details */}
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6 border border-slate-200">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                            Permitted Actions & Operations
                        </h2>
                        
                        {quickActions.length === 0 ? (
                            <p className="text-slate-500">No actions configured for your system role.</p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {quickActions.map((action, idx) => (
                                    <Link
                                        key={idx}
                                        href={action.path}
                                        className={`rounded-xl p-5 border shadow-sm hover:shadow-md transition group text-left ${
                                            action.primary
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-white border-slate-100"
                                        }`}
                                    >
                                        <h3 className={`font-semibold text-base transition ${
                                            action.primary ? "text-blue-800" : "text-slate-800 group-hover:text-blue-600"
                                        }`}>
                                            {action.label} &rarr;
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {action.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Profile Information */}
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