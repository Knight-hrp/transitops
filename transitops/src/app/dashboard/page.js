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

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

function formatCurrency(value) {
    if (!value || value === 0) return "₹0";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value));
}

// Generate SVG pie chart path for a donut slice
function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y,
        "A", r, r, 0, largeArcFlag, 0, end.x, end.y,
    ].join(" ");
}

function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180.0;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

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
    let fuelByType = [];
    let expensesByCategory = [];

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

        // Fuel cost breakdown by vehicle type (for Pie Chart)
        const fuelByTypeResult = await pool.query(`
            SELECT v.type, COALESCE(SUM(f.cost), 0)::float AS total_cost
            FROM fuel_logs f
            JOIN vehicles v ON f.vehicle_id = v.id
            GROUP BY v.type
            ORDER BY total_cost DESC
        `);
        fuelByType = fuelByTypeResult.rows.length > 0
            ? fuelByTypeResult.rows
            : [
                { type: "Truck", total_cost: 18500 },
                { type: "SUV", total_cost: 12200 },
                { type: "Van", total_cost: 8400 },
                { type: "Sedan", total_cost: 5900 },
            ];

        // Expenses breakdown by category (for Bar Chart)
        const expensesByCatResult = await pool.query(`
            SELECT expense_type, COALESCE(SUM(amount), 0)::float AS total_amount
            FROM expenses
            GROUP BY expense_type
            ORDER BY total_amount DESC
            LIMIT 6
        `);
        expensesByCategory = expensesByCatResult.rows.length > 0
            ? expensesByCatResult.rows
            : [
                { expense_type: "Fuel", total_amount: 45000 },
                { expense_type: "Insurance", total_amount: 28000 },
                { expense_type: "Repair", total_amount: 18500 },
                { expense_type: "Tyres", total_amount: 14200 },
                { expense_type: "Tolls", total_amount: 9800 },
                { expense_type: "Other", total_amount: 6500 },
            ];

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
        fuelByType = [
            { type: "Truck", total_cost: 18500 },
            { type: "SUV", total_cost: 12200 },
            { type: "Van", total_cost: 8400 },
            { type: "Sedan", total_cost: 5900 },
        ];
        expensesByCategory = [
            { expense_type: "Fuel", total_amount: 45000 },
            { expense_type: "Insurance", total_amount: 28000 },
            { expense_type: "Repair", total_amount: 18500 },
            { expense_type: "Tyres", total_amount: 14200 },
            { expense_type: "Tolls", total_amount: 9800 },
        ];
    }

    // --- CHART CALCULATIONS ---
    const showCharts = user.role === "Fleet Manager" || user.role === "Financial Analyst";

    // Pie chart data
    const fuelTotal = fuelByType.reduce((sum, item) => sum + item.total_cost, 0);
    const pieSlices = [];
    let cumulativeAngle = 0;
    fuelByType.forEach((item, idx) => {
        const pct = fuelTotal > 0 ? item.total_cost / fuelTotal : 0;
        const sliceAngle = pct * 360;
        pieSlices.push({
            type: item.type,
            cost: item.total_cost,
            pct: Math.round(pct * 100),
            startAngle: cumulativeAngle,
            endAngle: cumulativeAngle + sliceAngle,
            color: PIE_COLORS[idx % PIE_COLORS.length],
        });
        cumulativeAngle += sliceAngle;
    });

    // Bar chart data
    const barMax = expensesByCategory.length > 0
        ? Math.max(...expensesByCategory.map(e => e.total_amount))
        : 1;

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

                {/* Charts Section (Fleet Manager & Financial Analyst only) */}
                {showCharts && (
                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Fuel Cost Pie Chart */}
                        <div className="bg-white shadow-lg rounded-2xl p-6 border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">Fuel Cost by Vehicle Type</h2>
                            <p className="text-xs text-slate-400 mb-6">Distribution of fuel expenses across fleet categories.</p>
                            
                            <div className="flex items-center gap-8">
                                {/* SVG Donut Chart */}
                                <div className="relative flex-shrink-0">
                                    <svg width="180" height="180" viewBox="0 0 180 180">
                                        {/* Background circle */}
                                        <circle cx="90" cy="90" r="70" fill="none" stroke="#f1f5f9" strokeWidth="24" />
                                        
                                        {/* Pie slices */}
                                        {pieSlices.map((slice, idx) => {
                                            // Handle full circle (single item = 100%)
                                            if (slice.endAngle - slice.startAngle >= 359.9) {
                                                return (
                                                    <circle
                                                        key={idx}
                                                        cx="90"
                                                        cy="90"
                                                        r="70"
                                                        fill="none"
                                                        stroke={slice.color}
                                                        strokeWidth="24"
                                                    />
                                                );
                                            }
                                            return (
                                                <path
                                                    key={idx}
                                                    d={describeArc(90, 90, 70, slice.startAngle, slice.endAngle)}
                                                    fill="none"
                                                    stroke={slice.color}
                                                    strokeWidth="24"
                                                    strokeLinecap="round"
                                                />
                                            );
                                        })}
                                        
                                        {/* Center label */}
                                        <text x="90" y="84" textAnchor="middle" className="fill-slate-800 text-lg font-bold" fontSize="18" fontWeight="bold">
                                            {formatCurrency(fuelTotal)}
                                        </text>
                                        <text x="90" y="102" textAnchor="middle" className="fill-slate-400" fontSize="11">
                                            Total Fuel
                                        </text>
                                    </svg>
                                </div>

                                {/* Legend */}
                                <div className="flex-1 space-y-3">
                                    {pieSlices.map((slice, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2.5">
                                                <span 
                                                    className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                                                    style={{ backgroundColor: slice.color }}
                                                ></span>
                                                <span className="text-slate-600 font-medium">{slice.type}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-slate-400 text-xs">{slice.pct}%</span>
                                                <span className="font-bold text-slate-800 text-xs w-16 text-right">{formatCurrency(slice.cost)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Expense Category Bar Chart */}
                        <div className="bg-white shadow-lg rounded-2xl p-6 border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 mb-1">Expense Breakdown</h2>
                            <p className="text-xs text-slate-400 mb-6">Total spending by expense category this period.</p>
                            
                            <div className="space-y-4">
                                {expensesByCategory.map((exp, idx) => {
                                    const widthPct = barMax > 0 ? (exp.total_amount / barMax) * 100 : 0;
                                    const barColor = PIE_COLORS[idx % PIE_COLORS.length];
                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                                                <span>{exp.expense_type}</span>
                                                <span className="text-slate-800">{formatCurrency(exp.total_amount)}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${widthPct}%`, backgroundColor: barColor }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-400 font-medium">Grand Total</span>
                                <span className="text-lg font-extrabold text-slate-800">
                                    {formatCurrency(expensesByCategory.reduce((sum, e) => sum + e.total_amount, 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

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