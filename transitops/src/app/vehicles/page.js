"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import Link from "next/link";

const emptyForm = {
    registrationNumber: "",
    vehicleName: "",
    type: "SUV",
    maxLoadCapacity: "",
    odometer: "0",
    acquisitionCost: "",
    status: "Available",
    region: "",
};

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

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchVehicles();
    }, []);

    // Dismiss message alerts after 3 seconds
    useEffect(() => {
        if (message.text && message.type === "success") {
            const timer = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [message]);

    async function fetchVehicles() {
        setLoading(true);
        try {
            const response = await fetch("/api/vehicles");
            const data = await response.json();
            if (data.success) {
                setVehicles(data.vehicles);
            } else {
                setMessage({ type: "error", text: data.message || "Failed to load vehicles." });
            }
        } catch (error) {
            console.error("Error loading vehicles:", error);
            setMessage({ type: "error", text: "Something went wrong loading vehicles." });
        } finally {
            setLoading(false);
        }
    }

    const filteredVehicles = useMemo(() => {
        return vehicles.filter((v) => {
            const matchesSearch =
                v.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
                v.registrationNumber.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                statusFilter === "All Status" || v.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [vehicles, search, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: vehicles.length,
            available: vehicles.filter((v) => v.status === "Available").length,
            onTrip: vehicles.filter((v) => v.status === "On Trip").length,
            inShop: vehicles.filter((v) => v.status === "In Shop").length,
        };
    }, [vehicles]);

    function handleEdit(vehicle) {
        setEditingId(vehicle.id);
        setForm({
            registrationNumber: vehicle.registrationNumber,
            vehicleName: vehicle.vehicleName,
            type: vehicle.type,
            maxLoadCapacity: vehicle.maxLoadCapacity,
            odometer: vehicle.odometer,
            acquisitionCost: vehicle.acquisitionCost,
            status: vehicle.status,
            region: vehicle.region || "",
        });
        setFormErrors({});
        setIsFormOpen(true);
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this vehicle from the fleet?")) {
            return;
        }

        try {
            const response = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({ type: "success", text: "Vehicle removed successfully." });
                fetchVehicles();
            } else {
                setMessage({ type: "error", text: data.message || "Failed to delete vehicle." });
            }
        } catch (error) {
            console.error("Delete error:", error);
            setMessage({ type: "error", text: "Something went wrong deleting the vehicle." });
        }
    }

    // Client-side validation to catch errors before backend calls
    function validateForm() {
        const errors = {};

        // 1. Cannot enter blank space or symbols for name/registration
        const nameVal = form.vehicleName.trim();
        if (!nameVal) {
            errors.vehicleName = "Vehicle name is required.";
        } else if (nameVal.length > 100) {
            errors.vehicleName = "Vehicle name cannot exceed 100 characters.";
        } else if (!/^[a-zA-Z0-9\-_]+(?:\s[a-zA-Z0-9\-_]+)*$/.test(nameVal)) {
            errors.vehicleName = "Only letters, numbers, hyphens, underscores, and single spaces allowed (no special symbols).";
        }

        const regVal = form.registrationNumber.trim();
        if (!regVal) {
            errors.registrationNumber = "Registration number is required.";
        } else if (regVal.length > 50) {
            errors.registrationNumber = "Registration number cannot exceed 50 characters.";
        } else if (!/^[a-zA-Z0-9\-]+$/.test(regVal)) {
            errors.registrationNumber = "Only letters, numbers, and hyphens allowed (no spaces or symbols).";
        }

        if (!form.type) {
            errors.type = "Vehicle type is required.";
        }

        const load = Number(form.maxLoadCapacity);
        if (!form.maxLoadCapacity || isNaN(load) || load <= 0) {
            errors.maxLoadCapacity = "Max load capacity must be a positive number.";
        }

        const odo = Number(form.odometer);
        if (isNaN(odo) || odo < 0) {
            errors.odometer = "Odometer must be a non-negative number.";
        }

        const cost = Number(form.acquisitionCost);
        if (!form.acquisitionCost || isNaN(cost) || cost < 0) {
            errors.acquisitionCost = "Acquisition cost must be a non-negative number.";
        }

        if (form.region && !/^[a-zA-Z0-9\s\-]+$/.test(form.region)) {
            errors.region = "Only letters, numbers, hyphens, and spaces allowed.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage({ type: "", text: "" });

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        const payload = {
            registrationNumber: form.registrationNumber.trim().toUpperCase(),
            vehicleName: form.vehicleName.trim(),
            type: form.type,
            maxLoadCapacity: Number(form.maxLoadCapacity),
            odometer: Number(form.odometer),
            acquisitionCost: Number(form.acquisitionCost),
            status: form.status,
            region: form.region ? form.region.trim() : null,
        };

        try {
            const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";
            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({
                    type: "success",
                    text: editingId ? "Vehicle updated successfully!" : "Vehicle registered successfully!",
                });
                setIsFormOpen(false);
                setForm(emptyForm);
                setEditingId(null);
                fetchVehicles();
            } else {
                setMessage({
                    type: "error",
                    text: data.message || "Failed to save vehicle record.",
                });
            }
        } catch (error) {
            console.error("Save error:", error);
            setMessage({ type: "error", text: "Something went wrong saving the vehicle." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <AppNav />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Vehicles</h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            Monitor and manage your active transport fleet.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm(emptyForm);
                            setFormErrors({});
                            setIsFormOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
                    >
                        + Add Vehicle
                    </button>
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

                {/* Stats Summary Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="text-sm font-medium text-zinc-500">Total Fleet</div>
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
                        <div className="text-sm font-medium text-zinc-500">In Shop</div>
                        <div className="text-3xl font-bold text-red-500 mt-1">{stats.inShop}</div>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:max-w-md relative">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search vehicle name or registration..."
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
                            <option value="In Shop">In Shop</option>
                        </select>
                    </div>
                </div>

                {/* Table Data */}
                {loading ? (
                    <div className="text-center py-10 font-medium text-zinc-500">Loading vehicles list...</div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-12 text-center">
                        <div className="text-4xl">🚚</div>
                        <h3 className="font-semibold text-zinc-800 mt-3 text-lg">No vehicles found</h3>
                        <p className="text-zinc-500 text-sm mt-1">Try resetting your search query or filters.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-zinc-50 border-b border-zinc-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-zinc-600">Vehicle Name</th>
                                        <th className="p-4 font-semibold text-zinc-600">Reg. Number</th>
                                        <th className="p-4 font-semibold text-zinc-600">Type</th>
                                        <th className="p-4 font-semibold text-zinc-600 text-right">Max Load</th>
                                        <th className="p-4 font-semibold text-zinc-600 text-right">Odometer</th>
                                        <th className="p-4 font-semibold text-zinc-600 text-right">Acq. Cost</th>
                                        <th className="p-4 font-semibold text-zinc-600">Status</th>
                                        <th className="p-4 font-semibold text-zinc-600 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {filteredVehicles.map((v) => (
                                        <tr key={v.id} className="hover:bg-zinc-50">
                                            <td className="p-4 font-semibold text-zinc-950">{v.vehicleName}</td>
                                            <td className="p-4 font-mono text-xs tracking-wider text-zinc-600 uppercase">{v.registrationNumber}</td>
                                            <td className="p-4 text-zinc-600">{v.type}</td>
                                            <td className="p-4 text-right text-zinc-600">{Number(v.maxLoadCapacity).toLocaleString()} kg</td>
                                            <td className="p-4 text-right text-zinc-600">{Number(v.odometer).toLocaleString()} km</td>
                                            <td className="p-4 text-right text-zinc-900 font-medium">{formatCurrency(v.acquisitionCost)}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                        v.status === "Available"
                                                            ? "bg-green-100 text-green-800"
                                                            : v.status === "On Trip"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {v.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(v)}
                                                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded transition"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(v.id)}
                                                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded transition"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Slide-over Form Overlay */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
                    <div
                        className="fixed inset-0 bg-black/40 transition-opacity"
                        onClick={() => setIsFormOpen(false)}
                    />
                    <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-slide-in">
                        <header className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-zinc-900">
                                {editingId ? "Edit Vehicle" : "Add Vehicle to Fleet"}
                            </h2>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-zinc-400 hover:text-zinc-600 text-2xl outline-none"
                            >
                                &times;
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Vehicle Name / Identifier *
                                </label>
                                <input
                                    type="text"
                                    value={form.vehicleName}
                                    onChange={(e) => setForm({ ...form, vehicleName: e.target.value })}
                                    placeholder="e.g. Thar-01, Thar-02, Pickup-11"
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                        formErrors.vehicleName ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {formErrors.vehicleName && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.vehicleName}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Registration Number (License Plate) *
                                </label>
                                <input
                                    type="text"
                                    value={form.registrationNumber}
                                    onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                                    placeholder="e.g. MH12AB1234, DL3C-4567"
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none uppercase ${
                                        formErrors.registrationNumber ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {formErrors.registrationNumber && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.registrationNumber}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Type *
                                    </label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="SUV">SUV</option>
                                        <option value="Truck">Truck</option>
                                        <option value="Van">Van</option>
                                        <option value="Dumper">Dumper</option>
                                        <option value="Container">Container</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Available">Available</option>
                                        <option value="On Trip">On Trip</option>
                                        <option value="In Shop">In Shop</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Max Load (kg) *
                                    </label>
                                    <input
                                        type="number"
                                        value={form.maxLoadCapacity}
                                        onChange={(e) => setForm({ ...form, maxLoadCapacity: e.target.value })}
                                        placeholder="e.g. 1500"
                                        className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                            formErrors.maxLoadCapacity ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                        }`}
                                    />
                                    {formErrors.maxLoadCapacity && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.maxLoadCapacity}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Odometer (km)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.odometer}
                                        onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                                        placeholder="e.g. 12000"
                                        className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                            formErrors.odometer ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                        }`}
                                    />
                                    {formErrors.odometer && (
                                        <p className="text-xs text-red-500 mt-1">{formErrors.odometer}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Acquisition Cost (₹) *
                                </label>
                                <input
                                    type="number"
                                    value={form.acquisitionCost}
                                    onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
                                    placeholder="e.g. 1800000"
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                        formErrors.acquisitionCost ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {formErrors.acquisitionCost && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.acquisitionCost}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Operating Region
                                </label>
                                <input
                                    type="text"
                                    value={form.region}
                                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                                    placeholder="e.g. Mumbai, North Hub"
                                    className={`w-full border rounded-lg px-4 py-2.5 text-sm text-zinc-900 outline-none ${
                                        formErrors.region ? "border-red-500 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                                    }`}
                                />
                                {formErrors.region && (
                                    <p className="text-xs text-red-500 mt-1">{formErrors.region}</p>
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
                                    {saving ? "Saving..." : "Save Vehicle"}
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
