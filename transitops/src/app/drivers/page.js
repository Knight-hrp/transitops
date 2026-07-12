"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";

const emptyForm = {
    name: "",
    licenseNumber: "",
    licenseCategory: "Heavy Motor Vehicle (HMV)",
    licenseExpiryDate: "",
    contactNumber: "",
};

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

export default function DriversPage() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    
    // Auth & RBAC State
    const [userRole, setUserRole] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Fleet Manager basic modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});

    // Safety Officer update modal state
    const [isSafetyOpen, setIsSafetyOpen] = useState(false);
    const [safetyId, setSafetyId] = useState(null);
    const [safetyForm, setSafetyForm] = useState(emptySafetyForm);
    const [safetyErrors, setSafetyErrors] = useState({});

    const [message, setMessage] = useState({ type: "", text: "" });

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

    const filteredDrivers = useMemo(() => {
        return drivers.filter((d) => {
            const matchesSearch =
                d.name.toLowerCase().includes(search.toLowerCase()) ||
                d.licenseNumber.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === "All Status" || d.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [drivers, search, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: drivers.length,
            available: drivers.filter((d) => d.status === "Available").length,
            onTrip: drivers.filter((d) => d.status === "On Trip").length,
            suspended: drivers.filter((d) => d.status === "Suspended").length,
        };
    }, [drivers]);

    // Permissions configuration
    const isFM = userRole === "Fleet Manager";
    const isSO = userRole === "Safety Officer";
    const isDisp = userRole === "Dispatcher";

    function handleEditBasic(driver) {
        setEditingId(driver.id);
        setForm({
            name: driver.name,
            licenseNumber: driver.licenseNumber,
            licenseCategory: driver.licenseCategory || "Heavy Motor Vehicle (HMV)",
            licenseExpiryDate: driver.licenseExpiryDate ? driver.licenseExpiryDate.split("T")[0] : "",
            contactNumber: driver.contactNumber || "",
        });
        setFormErrors({});
        setIsFormOpen(true);
    }

    function handleEditSafety(driver) {
        setSafetyId(driver.id);
        setSafetyForm({
            safetyScore: String(driver.safetyScore),
            status: driver.status,
        });
        setSafetyErrors({});
        setIsSafetyOpen(true);
    }

    async function handleDelete(id) {
        if (!isFM) return;
        if (!confirm("Are you sure you want to remove this driver from the roster?")) {
            return;
        }

        try {
            const response = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({ type: "success", text: "Driver removed successfully." });
                fetchDrivers();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to remove driver." });
            }
        } catch (error) {
            console.error("Delete error:", error);
            setMessage({ type: "error", text: "Something went wrong deleting the driver." });
        }
    }

    // Client-side validations for Fleet Manager
    function validateBasicForm() {
        const errors = {};

        const nameVal = form.name.trim();
        if (!nameVal) {
            errors.name = "Driver name is required.";
        } else if (nameVal.length > 100) {
            errors.name = "Name cannot exceed 100 characters.";
        } else if (!/^[a-zA-Z0-9\-_]+(?:\s[a-zA-Z0-9\-_]+)*$/.test(nameVal)) {
            errors.name = "Only letters, numbers, hyphens, underscores, and single spaces allowed.";
        }

        const licVal = form.licenseNumber.trim();
        if (!licVal) {
            errors.licenseNumber = "License number is required.";
        } else if (licVal.length > 100) {
            errors.licenseNumber = "License number cannot exceed 100 characters.";
        } else if (!/^[a-zA-Z0-9\-]+$/.test(licVal)) {
            errors.licenseNumber = "Only letters, numbers, and hyphens allowed (no spaces or symbols).";
        }

        if (!form.licenseExpiryDate) {
            errors.licenseExpiryDate = "License expiry date is required.";
        } else {
            const expDate = new Date(form.licenseExpiryDate);
            if (isNaN(expDate.getTime())) {
                errors.licenseExpiryDate = "Please enter a valid date.";
            }
        }

        if (form.contactNumber) {
            const phone = form.contactNumber.trim();
            if (!/^\+?[0-9\s\-]{6,20}$/.test(phone)) {
                errors.contactNumber = "Please enter a valid phone number (6-20 characters, digits, spaces, hyphens, optional '+' prefix).";
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleBasicSubmit(event) {
        event.preventDefault();
        if (!isFM) return;
        setMessage({ type: "", text: "" });

        if (!validateBasicForm()) {
            return;
        }

        setSaving(true);

        const payload = {
            name: form.name.trim(),
            licenseNumber: form.licenseNumber.trim().toUpperCase(),
            licenseCategory: form.licenseCategory,
            licenseExpiryDate: form.licenseExpiryDate,
            contactNumber: form.contactNumber ? form.contactNumber.trim() : null,
        };

        try {
            const url = editingId ? `/api/drivers/${editingId}` : "/api/drivers";
            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({
                    type: "success",
                    text: editingId ? "Driver details updated successfully!" : "Driver registered successfully!",
                });
                setIsFormOpen(false);
                setForm(emptyForm);
                setEditingId(null);
                fetchDrivers();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to save driver record." });
            }
        } catch (error) {
            console.error("Save error:", error);
            setMessage({ type: "error", text: "Something went wrong saving the driver." });
        } finally {
            setSaving(false);
        }
    }

    // Client-side validations for Safety Officer
    function validateSafetyForm() {
        const errors = {};
        const score = Number(safetyForm.safetyScore);

        if (!safetyForm.safetyScore || isNaN(score) || score < 0 || score > 100) {
            errors.safetyScore = "Safety score must be a number between 0 and 100.";
        }

        if (!["Available", "On Trip", "Suspended"].includes(safetyForm.status)) {
            errors.status = "Please select a valid status option.";
        }

        setSafetyErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSafetySubmit(event) {
        event.preventDefault();
        if (!isSO) return;
        setMessage({ type: "", text: "" });

        if (!validateSafetyForm()) {
            return;
        }

        setSaving(true);

        const payload = {
            safetyScore: Number(safetyForm.safetyScore),
            status: safetyForm.status,
        };

        try {
            const response = await fetch(`/api/drivers/${safetyId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({ type: "success", text: "Driver safety score and status updated!" });
                setIsSafetyOpen(false);
                setSafetyId(null);
                fetchDrivers();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to update safety records." });
            }
        } catch (error) {
            console.error("Safety update error:", error);
            setMessage({ type: "error", text: "Something went wrong updating safety details." });
        } finally {
            setSaving(false);
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col">
                <AppNav />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-zinc-500 font-medium font-sans">Checking authorization...</div>
                </main>
            </div>
        );
    }

    // Financial Analyst is blocked from accessing the Driver Page entirely
    if (userRole === "Financial Analyst") {
        return (
            <div className="min-h-screen bg-zinc-50 flex flex-col">
                <AppNav />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center border border-zinc-200 animate-slide-in">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h2>
                        <p className="text-zinc-500 text-sm mb-6">
                            Your account system role (<strong>Financial Analyst</strong>) does not have access permissions for driver management operations.
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
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <AppNav />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Drivers</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            Monitor driver safety ratings, compliance, and dispatches.
                        </p>
                    </div>
                    {isFM && (
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setForm(emptyForm);
                                setFormErrors({});
                                setIsFormOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
                        >
                            + Add Driver
                        </button>
                    )}
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

                {/* Stats summary row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="text-sm font-medium text-zinc-500">Total Drivers</div>
                        <div className="text-3xl font-bold text-zinc-950 mt-1">{stats.total}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="text-sm font-medium text-zinc-500">Available</div>
                        <div className="text-3xl font-bold text-emerald-600 mt-1">{stats.available}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="text-sm font-medium text-zinc-500">On Trip</div>
                        <div className="text-3xl font-bold text-blue-600 mt-1">{stats.onTrip}</div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="text-sm font-medium text-zinc-500">Suspended</div>
                        <div className="text-3xl font-bold text-red-500 mt-1">{stats.suspended}</div>
                    </div>
                </div>

                {/* Search & Filter bar */}
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:max-w-md relative">
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
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto bg-white"
                        >
                            <option value="All Status">All Status</option>
                            <option value="Available">Available</option>
                            <option value="On Trip">On Trip</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>
                </div>

                {/* Drivers Table list */}
                {loading ? (
                    <div className="text-center py-10 font-medium text-zinc-500">Loading drivers database...</div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center">
                        <div className="text-4xl">👥</div>
                        <h3 className="font-semibold text-zinc-800 mt-3 text-lg">No drivers found</h3>
                        <p className="text-zinc-500 text-sm mt-1">Try adapting your search parameters or query.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-slide-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-zinc-600">Driver Name</th>
                                        <th className="p-4 font-semibold text-zinc-600">Contact</th>
                                        <th className="p-4 font-semibold text-zinc-600">License Number</th>
                                        <th className="p-4 font-semibold text-zinc-600">Category</th>
                                        <th className="p-4 font-semibold text-zinc-600">Expiry Date</th>
                                        <th className="p-4 font-semibold text-zinc-600 text-right font-mono">Safety Rating</th>
                                        <th className="p-4 font-semibold text-zinc-600">Status</th>
                                        {(isFM || isSO) && (
                                            <th className="p-4 font-semibold text-zinc-600 text-right">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {filteredDrivers.map((d) => (
                                        <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                                            <td className="p-4 font-semibold text-zinc-950">{d.name}</td>
                                            <td className="p-4 text-zinc-600">{d.contactNumber || "—"}</td>
                                            <td className="p-4 font-mono text-xs tracking-wider text-zinc-600 uppercase">{d.licenseNumber}</td>
                                            <td className="p-4 text-zinc-600 text-xs">{d.licenseCategory || "HMV"}</td>
                                            <td className="p-4 text-zinc-600">{formatDate(d.licenseExpiryDate)}</td>
                                            <td className="p-4 text-right">
                                                <span
                                                    className={`inline-flex font-bold px-2 py-0.5 rounded text-xs ${
                                                        Number(d.safetyScore) >= 90
                                                            ? "text-green-700 bg-green-50"
                                                            : Number(d.safetyScore) >= 75
                                                            ? "text-amber-700 bg-amber-50"
                                                            : "text-red-700 bg-red-50"
                                                    }`}
                                                >
                                                    {Number(d.safetyScore).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
                                            {(isFM || isSO) && (
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {isFM && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditBasic(d)}
                                                                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded transition font-medium"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(d.id)}
                                                                    className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded transition font-medium"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </>
                                                        )}
                                                        {isSO && (
                                                            <button
                                                                onClick={() => handleEditSafety(d)}
                                                                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded transition font-semibold"
                                                            >
                                                                Audit Safety
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Slide-over Form Overlay (Fleet Manager Mode) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                    <div
                        className="fixed inset-0 bg-black/40 transition-opacity"
                        onClick={() => setIsFormOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-slide-in">
                        <header className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 font-sans">
                                {editingId ? "Edit Driver Profile" : "Register Driver"}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-zinc-400 hover:text-zinc-600 text-2xl outline-none"
                            >
                                &times;
                            </button>
                        </header>

                        <form onSubmit={handleBasicSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                        formErrors.name ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {formErrors.name && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    License Number *
                                </label>
                                <input
                                    type="text"
                                    value={form.licenseNumber}
                                    onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                                    placeholder="e.g. MH-12-202201928"
                                    disabled={editingId !== null}
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none uppercase ${
                                        editingId !== null ? "bg-zinc-50 border-zinc-200 text-zinc-500 cursor-not-allowed" :
                                        formErrors.licenseNumber ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {formErrors.licenseNumber && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.licenseNumber}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    License Category *
                                </label>
                                <select
                                    value={form.licenseCategory}
                                    onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}
                                    className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Light Motor Vehicle (LMV)">Light Motor Vehicle (LMV)</option>
                                    <option value="Medium Motor Vehicle (MMV)">Medium Motor Vehicle (MMV)</option>
                                    <option value="Heavy Motor Vehicle (HMV)">Heavy Motor Vehicle (HMV)</option>
                                    <option value="Hazardous Goods (HAZMAT)">Hazardous Goods (HAZMAT)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    License Expiry Date *
                                </label>
                                <input
                                    type="date"
                                    value={form.licenseExpiryDate}
                                    onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })}
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                        formErrors.licenseExpiryDate ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {formErrors.licenseExpiryDate && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.licenseExpiryDate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Contact Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={form.contactNumber}
                                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                                    placeholder="e.g. +91 98765 43210"
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                        formErrors.contactNumber ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {formErrors.contactNumber && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.contactNumber}</p>
                                )}
                            </div>

                            <footer className="pt-4 flex gap-3 border-t border-zinc-150">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 font-semibold py-2.5 rounded-lg text-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                                >
                                    {saving ? "Saving..." : "Save Details"}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {/* Slide-over Form Overlay (Safety Officer Mode) */}
            {isSafetyOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                    <div
                        className="fixed inset-0 bg-black/40 transition-opacity"
                        onClick={() => setIsSafetyOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-slide-in">
                        <header className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900 font-sans">
                                Safety & Compliance Audit
                            </h2>
                            <button
                                onClick={() => setIsSafetyOpen(false)}
                                className="text-zinc-400 hover:text-zinc-600 text-2xl outline-none"
                            >
                                &times;
                            </button>
                        </header>

                        <form onSubmit={handleSafetySubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Safety & Compliance Rating (0-100) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={safetyForm.safetyScore}
                                    onChange={(e) => setSafetyForm({ ...safetyForm, safetyScore: e.target.value })}
                                    placeholder="e.g. 98.5"
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                        safetyErrors.safetyScore ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {safetyErrors.safetyScore && (
                                    <p className="text-xs text-red-500 mt-1">{safetyErrors.safetyScore}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Driver Operational Status *
                                </label>
                                <select
                                    value={safetyForm.status}
                                    onChange={(e) => setSafetyForm({ ...safetyForm, status: e.target.value })}
                                    className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Available">Available</option>
                                    <option value="On Trip">On Trip</option>
                                    <option value="Suspended">Suspended (Blocked from dispatches)</option>
                                </select>
                                {safetyErrors.status && (
                                    <p className="text-xs text-red-500 mt-1">{safetyErrors.status}</p>
                                )}
                            </div>

                            <footer className="pt-4 flex gap-3 border-t border-zinc-150">
                                <button
                                    type="button"
                                    onClick={() => setIsSafetyOpen(false)}
                                    className="flex-1 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 font-semibold py-2.5 rounded-lg text-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                                >
                                    {saving ? "Updating..." : "Apply Compliance"}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
