"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";

const emptySafetyForm = {
    safetyScore: "100",
    status: "Available",
};

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function SafetyCompliancePage() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [complianceFilter, setComplianceFilter] = useState("All Compliance");

    // Auth & RBAC State
    const [userRole, setUserRole] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Audit compliance modal state
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [auditForm, setAuditForm] = useState(emptySafetyForm);
    const [auditErrors, setAuditErrors] = useState({});

    // Read-only modal state for other roles
    const [isViewOpen, setIsViewOpen] = useState(false);

    const [message, setMessage] = useState({ type: "", text: "" });

    // Current simulated date
    const SIMULATED_TODAY = new Date("2026-07-12");

    useEffect(() => {
        fetchUserRole();
        fetchDrivers();
    }, []);

    // Dismiss message alerts after 3 seconds
    useEffect(() => {
        if (message.text && message.type === "success") {
            const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [message]);

    async function fetchUserRole() {
        setAuthLoading(true);
        try {
            const response = await fetch("/api/auth/me");
            const data = await response.json();
            if (data.success && data.user) {
                setUserRole(data.user.role);
            } else {
                setUserRole(null);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserRole(null);
        } finally {
            setAuthLoading(false);
        }
    }

    async function fetchDrivers() {
        setLoading(true);
        try {
            const response = await fetch("/api/drivers");
            const data = await response.json();
            if (data.success) {
                setDrivers(data.drivers);
            } else {
                setMessage({ type: "error", text: data.message || "Failed to load drivers." });
            }
        } catch (error) {
            console.error("Error loading drivers:", error);
            setMessage({ type: "error", text: "Something went wrong loading drivers." });
        } finally {
            setLoading(false);
        }
    }

    // Dynamic compliance status calculation
    const getComplianceStatus = (driver) => {
        if (driver.status === "Suspended") {
            return { text: "Non-Compliant", statusClass: "bg-red-100 text-red-800 border-red-200", icon: "❌" };
        }
        
        if (Number(driver.safetyScore) < 60) {
            return { text: "Non-Compliant", statusClass: "bg-red-100 text-red-800 border-red-200", icon: "❌" };
        }

        if (!driver.licenseExpiryDate) {
            return { text: "Non-Compliant", statusClass: "bg-red-100 text-red-800 border-red-200", icon: "❌" };
        }

        const expiry = new Date(driver.licenseExpiryDate);
        const diffTime = expiry.getTime() - SIMULATED_TODAY.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: "Non-Compliant (Expired)", statusClass: "bg-red-100 text-red-800 border-red-200", icon: "❌" };
        }
        if (diffDays <= 30) {
            return { text: "Expiring Soon", statusClass: "bg-amber-100 text-amber-800 border-amber-200", icon: "⚠️" };
        }

        return { text: "Compliant", statusClass: "bg-green-100 text-green-800 border-green-200", icon: "✅" };
    };

    // Parse and filter drivers
    const driversWithCompliance = useMemo(() => {
        return drivers.map((d) => ({
            ...d,
            compliance: getComplianceStatus(d),
        }));
    }, [drivers]);

    const filteredDrivers = useMemo(() => {
        return driversWithCompliance.filter((d) => {
            const matchesSearch =
                d.name.toLowerCase().includes(search.toLowerCase()) ||
                d.licenseNumber.toLowerCase().includes(search.toLowerCase());

            const matchesCompliance =
                complianceFilter === "All Compliance" || 
                d.compliance.text.startsWith(complianceFilter);

            return matchesSearch && matchesCompliance;
        });
    }, [driversWithCompliance, search, complianceFilter]);

    // Calculate safety aggregates
    const stats = useMemo(() => {
        const total = drivers.length;
        const avgScore = total > 0 
            ? Math.round(drivers.reduce((acc, curr) => acc + Number(curr.safetyScore), 0) / total)
            : 85;

        return {
            total,
            avgScore,
            suspended: drivers.filter((d) => d.status === "Suspended").length,
        };
    }, [drivers]);

    const isSO = userRole === "Safety Officer";
    const isFM = userRole === "Fleet Manager";
    const isAuthorized = isSO || isFM;

    function handleOpenAudit(driver) {
        setSelectedDriver(driver);
        setAuditForm({
            safetyScore: String(driver.safetyScore),
            status: driver.status,
        });
        setAuditErrors({});
        setIsAuditOpen(true);
    }

    function handleOpenView(driver) {
        setSelectedDriver(driver);
        setIsViewOpen(true);
    }

    function validateAuditForm() {
        const errors = {};
        const score = Number(auditForm.safetyScore);

        if (!auditForm.safetyScore || isNaN(score) || score < 0 || score > 100) {
            errors.safetyScore = "Safety score must be a number between 0 and 100.";
        }

        if (!["Available", "On Trip", "Suspended"].includes(auditForm.status)) {
            errors.status = "Please select a valid operational status.";
        }

        setAuditErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleAuditSubmit(event) {
        event.preventDefault();
        if (!isSO) return;
        setMessage({ type: "", text: "" });

        if (!validateAuditForm()) {
            return;
        }

        setSaving(true);

        const payload = {
            safetyScore: Number(auditForm.safetyScore),
            status: auditForm.status,
        };

        try {
            const response = await fetch(`/api/drivers/${selectedDriver.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({ type: "success", text: `Compliance update saved for driver: ${selectedDriver.name}.` });
                setIsAuditOpen(false);
                setSelectedDriver(null);
                fetchDrivers();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to save safety changes." });
            }
        } catch (error) {
            console.error("Safety audit update error:", error);
            setMessage({ type: "error", text: "Something went wrong updating safety compliance details." });
        } finally {
            setSaving(false);
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
                <AppNav />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-zinc-500 font-medium">Checking authorization...</div>
                </main>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
                <AppNav />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center border border-zinc-200 animate-slide-in">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h2>
                        <p className="text-zinc-500 text-sm mb-6">
                            Your account system role (<strong>{userRole || "Guest"}</strong>) does not have access permissions for Safety & Compliance records.
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

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
            <AppNav />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Safety & Compliance</h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Monitor driver compliance indexes, safety score card ratings, and regulatory statuses.
                    </p>
                </div>

                {/* Notifications */}
                {message.text && (
                    <div
                        className={`mb-6 p-4 rounded-lg border text-sm font-medium ${
                            message.type === "success"
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-red-50 border-red-200 text-red-700"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Compliance Aggregated Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-5">
                        <div className="text-3xl bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center">👤</div>
                        <div>
                            <div className="text-sm font-semibold text-zinc-500">Total Drivers</div>
                            <div className="text-3xl font-extrabold text-zinc-950 mt-0.5">{stats.total}</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-5">
                        <div className="text-3xl bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center">🛡️</div>
                        <div>
                            <div className="text-sm font-semibold text-zinc-500">Avg Safety Score</div>
                            <div className="text-3xl font-extrabold text-emerald-600 mt-0.5">{stats.avgScore}.0%</div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-5">
                        <div className="text-3xl bg-red-50 w-12 h-12 rounded-xl flex items-center justify-center">⚠️</div>
                        <div>
                            <div className="text-sm font-semibold text-zinc-500">Suspended Drivers</div>
                            <div className="text-3xl font-extrabold text-red-500 mt-0.5">{stats.suspended}</div>
                        </div>
                    </div>
                </div>

                {/* Search & Compliance Filter */}
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:max-w-md">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search driver name or license number..."
                            className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            value={complianceFilter}
                            onChange={(e) => setComplianceFilter(e.target.value)}
                            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto bg-white"
                        >
                            <option value="All Compliance">All Compliance</option>
                            <option value="Compliant">Compliant</option>
                            <option value="Expiring Soon">Expiring Soon</option>
                            <option value="Non-Compliant">Non-Compliant</option>
                        </select>
                    </div>
                </div>

                {/* Compliance Table */}
                {loading ? (
                    <div className="text-center py-10 font-medium text-zinc-500">Loading compliance audit list...</div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center">
                        <div className="text-4xl">🛡️</div>
                        <h3 className="font-semibold text-zinc-800 mt-3 text-lg">No records found</h3>
                        <p className="text-zinc-500 text-sm mt-1">Try adapting your search filter keywords.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-slide-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-zinc-600">Driver</th>
                                        <th className="p-4 font-semibold text-zinc-600">License No.</th>
                                        <th className="p-4 font-semibold text-zinc-600">License Expiry</th>
                                        <th className="p-4 font-semibold text-zinc-600 text-right">Safety Score</th>
                                        <th className="p-4 font-semibold text-zinc-600">Status</th>
                                        <th className="p-4 font-semibold text-zinc-600">Compliance</th>
                                        <th className="p-4 font-semibold text-zinc-600 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {filteredDrivers.map((d) => (
                                        <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="p-4 font-semibold text-zinc-950">{d.name}</td>
                                            <td className="p-4 font-mono text-xs text-zinc-600 uppercase">{d.licenseNumber}</td>
                                            <td className="p-4 text-zinc-600">{d.licenseExpiryDate ? d.licenseExpiryDate.split("T")[0] : "—"}</td>
                                            <td className="p-4 text-right font-bold text-zinc-700">{Math.round(d.safetyScore)}%</td>
                                            <td className="p-4">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        d.status === "Available"
                                                            ? "bg-green-100 text-green-800"
                                                            : d.status === "On Trip"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {d.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${d.compliance.statusClass}`}>
                                                    <span>{d.compliance.icon}</span>
                                                    <span>{d.compliance.text}</span>
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {isSO ? (
                                                    <button
                                                        onClick={() => handleOpenAudit(d)}
                                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded shadow-sm transition"
                                                    >
                                                        Review
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenView(d)}
                                                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded transition"
                                                    >
                                                        View
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Slide-over Compliance Form Overlay (Safety Officer Audit Mode) */}
            {isAuditOpen && selectedDriver && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                    <div
                        className="fixed inset-0 bg-black/40 transition-opacity"
                        onClick={() => setIsAuditOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-slide-in">
                        <header className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 font-sans">
                                Compliance Audit: {selectedDriver.name}
                            </h2>
                            <button
                                onClick={() => setIsAuditOpen(false)}
                                className="text-zinc-400 hover:text-zinc-600 text-2xl outline-none"
                            >
                                &times;
                            </button>
                        </header>

                        <form onSubmit={handleAuditSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary profile card */}
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">License Number:</span>
                                    <span className="font-semibold text-zinc-900 font-mono uppercase">{selectedDriver.licenseNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">License Expiry:</span>
                                    <span className="font-semibold text-zinc-900">{formatDate(selectedDriver.licenseExpiryDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Current Compliance Index:</span>
                                    <span className={`font-bold ${selectedDriver.compliance.text.startsWith("Compliant") ? "text-emerald-600" : "text-red-500"}`}>
                                        {selectedDriver.compliance.text}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Safety Rating Score (0-100) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={auditForm.safetyScore}
                                    onChange={(e) => setAuditForm({ ...auditForm, safetyScore: e.target.value })}
                                    placeholder="e.g. 95.0"
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                        auditErrors.safetyScore ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {auditErrors.safetyScore && (
                                    <p className="text-xs text-red-500 mt-1">{auditErrors.safetyScore}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Operational Roster Status *
                                </label>
                                <select
                                    value={auditForm.status}
                                    onChange={(e) => setAuditForm({ ...auditForm, status: e.target.value })}
                                    className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Available">Available (Compliant)</option>
                                    <option value="On Trip">On Trip (Active)</option>
                                    <option value="Suspended">Suspended (Blocked from dispatches)</option>
                                </select>
                                {auditErrors.status && (
                                    <p className="text-xs text-red-500 mt-1">{auditErrors.status}</p>
                                )}
                                <p className="text-xxs text-zinc-400 mt-1.5 leading-relaxed">
                                    Changing status to Suspended immediately sets the compliance index to Non-Compliant and prevents trip assignment.
                                </p>
                            </div>

                            <footer className="pt-4 flex gap-3 border-t border-zinc-150">
                                <button
                                    type="button"
                                    onClick={() => setIsAuditOpen(false)}
                                    className="flex-1 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 font-semibold py-2.5 rounded-lg text-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow-sm"
                                >
                                    {saving ? "Saving Update..." : "Apply Compliance"}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {/* Read-Only Information Modal (Fleet Manager Mode) */}
            {isViewOpen && selectedDriver && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                    <div
                        className="fixed inset-0 bg-black/40 transition-opacity"
                        onClick={() => setIsViewOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-slide-in">
                        <header className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 font-sans">
                                Compliance Sheet: {selectedDriver.name}
                            </h2>
                            <button
                                onClick={() => setIsViewOpen(false)}
                                className="text-zinc-400 hover:text-zinc-600 text-2xl outline-none"
                            >
                                &times;
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-4">
                                <div className="flex justify-between border-b border-zinc-150 pb-2">
                                    <span className="text-zinc-500 font-medium text-xs">License Status</span>
                                    <span className="font-semibold text-zinc-900 text-xs uppercase">{selectedDriver.licenseCategory || "HMV"}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-150 pb-2">
                                    <span className="text-zinc-500 font-medium text-xs">License Number</span>
                                    <span className="font-semibold text-zinc-900 text-xs font-mono uppercase">{selectedDriver.licenseNumber}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-150 pb-2">
                                    <span className="text-zinc-500 font-medium text-xs">Expiry Date</span>
                                    <span className="font-semibold text-zinc-900 text-xs">{formatDate(selectedDriver.licenseExpiryDate)}</span>
                                </div>
                                <div className="flex justify-between border-b border-zinc-150 pb-2">
                                    <span className="text-zinc-500 font-medium text-xs">Safety Rating</span>
                                    <span className="font-bold text-zinc-950 text-xs">{Math.round(selectedDriver.safetyScore)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500 font-medium text-xs">Compliance Index</span>
                                    <span className={`font-bold text-xs ${selectedDriver.compliance.text.startsWith("Compliant") ? "text-emerald-600" : "text-red-500"}`}>
                                        {selectedDriver.compliance.text}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xxs text-zinc-400 italic">
                                Only users with the Safety Officer system role are permitted to modify driver safety records or update compliance settings.
                            </p>

                            <footer className="pt-4 flex border-t border-zinc-150">
                                <button
                                    type="button"
                                    onClick={() => setIsViewOpen(false)}
                                    className="flex-1 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 font-semibold py-2.5 rounded-lg text-sm transition"
                                >
                                    Close Record
                                </button>
                            </footer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
