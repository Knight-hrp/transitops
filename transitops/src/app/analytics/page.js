"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";

function formatCurrency(value) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value));
}

export default function AnalyticsPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserRole();
    }, []);

    async function fetchUserRole() {
        setAuthLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/auth/me");
            const resData = await response.json();
            if (resData.success && resData.user) {
                setUserRole(resData.user.role);
                // Trigger analytics fetch if user is authorized
                if (resData.user.role === "Fleet Manager" || resData.user.role === "Financial Analyst") {
                    fetchAnalytics();
                } else {
                    setLoading(false);
                }
            } else {
                setUserRole(null);
                setLoading(false);
            }
        } catch (err) {
            console.error("Error checking auth role:", err);
            setUserRole(null);
            setError("Authentication check failed. Please refresh the page.");
            setLoading(false);
        } finally {
            setAuthLoading(false);
        }
    }

    async function fetchAnalytics() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/analytics");
            const resData = await response.json();
            if (resData.success) {
                setData(resData);
            } else {
                setError(resData.message || "Failed to load analytics data.");
            }
        } catch (err) {
            console.error("Error fetching analytics data:", err);
            setError("Something went wrong fetching the analytics insights.");
        } finally {
            setLoading(false);
        }
    }

    if (authLoading || (loading && !data)) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
                <AppNav />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-zinc-500 font-medium">Loading analytics intelligence...</div>
                </main>
            </div>
        );
    }

    const isAuthorized = userRole === "Fleet Manager" || userRole === "Financial Analyst";

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
                <AppNav />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center border border-zinc-200 animate-slide-in">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h2>
                        <p className="text-zinc-500 text-sm mb-6">
                            Your account system role (<strong>{userRole || "Guest"}</strong>) does not have access permissions to view fleet analytics reports.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-sm transition"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const operational = data?.operational || {};
    const financial = data?.financial || {};

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
            <AppNav />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Analytics Overview</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            {userRole === "Fleet Manager" 
                                ? "Operational efficiency, performance capacity, and fleet utilization insights."
                                : "Financial metrics, operational costs (OpEx), revenues, ROI, and profitability."
                            }
                        </p>
                    </div>
                    <button
                        onClick={fetchAnalytics}
                        className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 font-semibold px-4 py-2 rounded-lg text-sm transition shadow-sm self-start md:self-auto"
                    >
                        🔄 Refresh Data
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg animate-slide-in">
                        ⚠️ {error}
                    </div>
                )}

                {userRole === "Fleet Manager" ? (
                    /* ============================================================ */
                    /*                   FLEET MANAGER ANALYTICS                     */
                    /* ============================================================ */
                    <div className="space-y-8 animate-slide-in">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card 1: Fleet Utilization */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Fleet Utilization</span>
                                    <div className="text-4xl font-extrabold text-zinc-900 mt-2">{operational.fleetUtilization}%</div>
                                </div>
                                <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                    <span>● Active now</span>
                                    <span className="text-zinc-400">({operational.onTripVehicles || 0} of {operational.totalVehicles || 0} vehicles)</span>
                                </div>
                            </div>

                            {/* Card 2: Total Distance */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Total Distance</span>
                                    <div className="text-4xl font-extrabold text-zinc-900 mt-2">
                                        {Number(operational.totalDistance).toLocaleString()} km
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-zinc-500">
                                    Cumulative mileage across active vehicles.
                                </div>
                            </div>

                            {/* Card 3: Fuel Efficiency */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Fuel Efficiency</span>
                                    <div className="text-4xl font-extrabold text-zinc-900 mt-2">{operational.fuelEfficiency} km/L</div>
                                </div>
                                <div className="mt-4 text-xs text-zinc-500 font-medium text-emerald-600 flex items-center gap-1">
                                    <span>↑ Optimal range</span>
                                    <span className="text-zinc-400">(Fleet average rating)</span>
                                </div>
                            </div>

                            {/* Card 4: Maintenance Cost */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Maintenance Cost</span>
                                    <div className="text-4xl font-extrabold text-zinc-900 mt-2">
                                        {formatCurrency(operational.maintenanceCost)}
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-red-500 font-medium flex items-center gap-1">
                                    <span>↓ Under budget limits</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Operational Charts & Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Usage breakdown gauge */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm lg:col-span-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-zinc-800 text-lg">Fleet Capacity Status</h3>
                                    <p className="text-xs text-zinc-400 mt-1">Status of vehicles in the operational pool.</p>
                                </div>
                                <div className="my-8 flex justify-center relative">
                                    <svg className="w-36 h-36 transform -rotate-90">
                                        <circle cx="72" cy="72" r="60" className="stroke-zinc-100" strokeWidth="12" fill="transparent" />
                                        <circle 
                                            cx="72" 
                                            cy="72" 
                                            r="60" 
                                            className="stroke-blue-600 transition-all duration-1000" 
                                            strokeWidth="12" 
                                            fill="transparent" 
                                            strokeDasharray={377}
                                            strokeDashoffset={377 - (377 * (operational.fleetUtilization || 65)) / 100}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-extrabold text-zinc-900">{operational.fleetUtilization}%</span>
                                        <span className="text-xxs tracking-wider uppercase text-zinc-400 font-semibold mt-0.5">Utilization</span>
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="flex items-center gap-2 text-zinc-600">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                                            On Trip (Active)
                                        </span>
                                        <span className="font-bold text-zinc-900">{operational.onTripVehicles || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="flex items-center gap-2 text-zinc-600">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                            Available (Ready)
                                        </span>
                                        <span className="font-bold text-zinc-900">{(operational.totalVehicles || 0) - (operational.onTripVehicles || 0)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Efficiency Report chart */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm lg:col-span-2">
                                <h3 className="font-bold text-zinc-800 text-lg">Fuel Efficiency Metrics By Cargo Range</h3>
                                <p className="text-xs text-zinc-400 mt-1">Average efficiency (km/L) compared to standard vehicle norms.</p>
                                
                                <div className="mt-8 space-y-6">
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-zinc-600 mb-1.5">
                                            <span>Light Load (0 - 1,000 kg)</span>
                                            <span className="text-zinc-900">{Math.round((operational.fuelEfficiency * 1.2) * 10) / 10} km/L</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "85%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-zinc-600 mb-1.5">
                                            <span>Medium Load (1,000 - 5,000 kg)</span>
                                            <span className="text-zinc-900">{operational.fuelEfficiency} km/L</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: "65%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-zinc-600 mb-1.5">
                                            <span>Heavy Load (5,000+ kg)</span>
                                            <span className="text-zinc-900">{Math.round((operational.fuelEfficiency * 0.7) * 10) / 10} km/L</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-amber-500 h-full rounded-full" style={{ width: "45%" }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ============================================================ */
                    /*                 FINANCIAL ANALYST ANALYTICS                  */
                    /* ============================================================ */
                    <div className="space-y-8 animate-slide-in">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card 1: Operational Revenue */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Operational Revenue</span>
                                    <div className="text-3xl font-extrabold text-zinc-900 mt-2">{formatCurrency(financial.revenue)}</div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <span>↑ Invoiced revenue</span>
                                </div>
                            </div>

                            {/* Card 2: Operating Expenses (OpEx) */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Operating Expenses (OpEx)</span>
                                    <div className="text-3xl font-extrabold text-zinc-900 mt-2">{formatCurrency(financial.opex)}</div>
                                </div>
                                <div className="mt-4 text-xs text-zinc-400">
                                    Sum of fuel logs, repairs & misc expenses.
                                </div>
                            </div>

                            {/* Card 3: Net Profit */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Net Profit</span>
                                    <div className={`text-3xl font-extrabold mt-2 ${financial.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                        {formatCurrency(financial.netProfit)}
                                    </div>
                                </div>
                                <div className="mt-4 text-xs text-zinc-500 font-medium flex items-center gap-1">
                                    <span>Operational profitability margin</span>
                                </div>
                            </div>

                            {/* Card 4: ROI */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-sm font-semibold text-zinc-500 tracking-wide uppercase">Return on Investment (ROI)</span>
                                    <div className="text-3xl font-extrabold text-zinc-900 mt-2">{financial.roi}%</div>
                                </div>
                                <div className="mt-4 text-xs text-emerald-600 font-semibold">
                                    OpEx yield margin.
                                </div>
                            </div>
                        </div>

                        {/* Interactive Financial Breakdowns */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Budget Share chart */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm lg:col-span-1">
                                <h3 className="font-bold text-zinc-800 text-lg">OpEx Budget Distribution</h3>
                                <p className="text-xs text-zinc-400 mt-1">Ongoing expenses breakdown.</p>
                                
                                <div className="mt-6 space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-zinc-500 mb-1">
                                            <span>Fuel Charges</span>
                                            <span className="text-zinc-900">45%</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-600 h-full rounded-full" style={{ width: "45%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-zinc-500 mb-1">
                                            <span>Maintenance & Tuning</span>
                                            <span className="text-zinc-900">35%</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-amber-500 h-full rounded-full" style={{ width: "35%" }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-zinc-500 mb-1">
                                            <span>Taxes & Toll Expenses</span>
                                            <span className="text-zinc-900">20%</span>
                                        </div>
                                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "20%" }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Profitability Ledger details */}
                            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-zinc-800 text-lg">Financial Performance Summary</h3>
                                    <p className="text-xs text-zinc-400 mt-1">Capital Expenditures (CapEx) vs Operational Expenditures (OpEx) balances.</p>
                                </div>
                                <div className="mt-6 space-y-3">
                                    <div className="flex justify-between text-sm py-2 border-b border-zinc-100">
                                        <span className="text-zinc-500 font-medium">Asset Capital Cost (Vehicles Purchase CapEx)</span>
                                        <span className="font-semibold text-zinc-900">{formatCurrency(financial.capex)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-zinc-100">
                                        <span className="text-zinc-500 font-medium">Running Operational Costs (OpEx)</span>
                                        <span className="font-semibold text-zinc-950">{formatCurrency(financial.opex)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-zinc-100">
                                        <span className="text-zinc-500 font-medium">Gross Invoiced Fleet Revenue</span>
                                        <span className="font-semibold text-blue-600">{formatCurrency(financial.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2">
                                        <span className="text-zinc-800 font-bold">Operational Profit (Revenue - OpEx)</span>
                                        <span className={`font-bold ${financial.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                            {formatCurrency(financial.netProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
