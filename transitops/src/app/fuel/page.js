"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  vehicleId: "",
  driver: "",
  liters: "",
  cost: "",
  date: "",
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

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FuelLogs() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFuelLogs();
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (message.text && message.type === "success") {
      const timeout = setTimeout(() => setMessage({ type: "", text: "" }), 2000);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [message]);

  const filteredLogs = useMemo(() => {
    return fuelLogs.filter((log) => {
      const searchText = search.toLowerCase();
      return (
        log.vehicle.toLowerCase().includes(searchText) ||
        log.driver.toLowerCase().includes(searchText)
      );
    });
  }, [fuelLogs, search]);

  async function fetchFuelLogs() {
    try {
      const response = await fetch("/api/fuel");
      const data = await response.json();
      if (data.success) {
        setFuelLogs(data.fuelLogs || []);
      } else {
        setMessage({ type: "error", text: data.message || "Unable to load fuel logs." });
      }
    } catch {
      setMessage({ type: "error", text: "Unable to load fuel logs." });
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehicles() {
    try {
      const response = await fetch("/api/fuel/vehicles");
      const data = await response.json();
      if (data.success) {
        setVehicles(data.vehicles || []);
      }
    } catch {
      // Ignore vehicle fetch errors
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setIsFormOpen(true);
  }

  function openEdit(log) {
    setEditingId(log.id);
    setForm({
      vehicleId: log.vehicleId,
      driver: log.driver,
      liters: String(log.liters),
      cost: String(log.cost),
      date: log.date ? new Date(log.date).toISOString().slice(0, 10) : "",
    });
    setErrors({});
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }));
    }
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.vehicleId) {
      nextErrors.vehicleId = "Vehicle is required.";
    }
    if (!form.driver.trim()) {
      nextErrors.driver = "Driver is required.";
    }
    if (!form.liters || Number(form.liters) <= 0) {
      nextErrors.liters = "Liters must be greater than zero.";
    }
    if (form.cost === "" || Number(form.cost) < 0) {
      nextErrors.cost = "Cost must be a non-negative number.";
    }
    if (!form.date) {
      nextErrors.date = "Date is required.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMessage({ type: "error", text: "Please fix the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehicleId: Number(form.vehicleId),
        driver: form.driver.trim(),
        liters: Number(form.liters),
        cost: Number(form.cost),
        date: form.date,
      };

      const response = await fetch(editingId ? `/api/fuel/${editingId}` : "/api/fuel", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: editingId ? "Fuel log updated successfully." : "Fuel log created successfully." });
        await fetchFuelLogs();
        closeForm();
      } else {
        setMessage({ type: "error", text: data.message || "Unable to save fuel log." });
        setErrors(data.errors || {});
      }
    } catch {
      setMessage({ type: "error", text: "Unable to save fuel log." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this fuel log?")) {
      return;
    }

    try {
      const response = await fetch(`/api/fuel/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Fuel log deleted successfully." });
        await fetchFuelLogs();
      } else {
        setMessage({ type: "error", text: data.message || "Unable to delete fuel log." });
      }
    } catch {
      setMessage({ type: "error", text: "Unable to delete fuel log." });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              Fleet Fuel
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Fuel Logs</h1>
            <p className="mt-2 text-slate-600">Monitor vehicle fuel consumption and expenses.</p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
          >
            + Add Fuel Log
          </button>
        </div>

        {message.text ? (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mb-8 flex flex-wrap gap-6">
          <div className="min-w-55 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Fuel</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">{fuelLogs.reduce((sum, item) => sum + Number(item.liters || 0), 0)} L</h2>
            <p className="mt-2 text-sm text-emerald-600">+8% from last month</p>
          </div>
          <div className="min-w-55 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Cost</p>
            <h2 className="mt-3 text-3xl font-semibold text-emerald-600">
              {formatCurrency(fuelLogs.reduce((sum, item) => sum + Number(item.cost || 0), 0))}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Across {fuelLogs.length} records</p>
          </div>
          <div className="min-w-55 flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Avg/Litre</p>
            <h2 className="mt-3 text-3xl font-semibold text-blue-600">
              {fuelLogs.length > 0
                ? formatCurrency(
                    fuelLogs.reduce((sum, item) => sum + Number(item.cost || 0), 0) /
                      fuelLogs.reduce((sum, item) => sum + Number(item.liters || 0), 0)
                  )
                : "—"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Stable this week</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vehicle or driver..."
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-600">
                <th className="px-6 py-5">Vehicle</th>
                <th className="px-6 py-5">Driver</th>
                <th className="px-6 py-5">Fuel</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                    Loading fuel logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                    No fuel logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                    <td className="px-6 py-5 font-semibold text-slate-800">⛽ {log.vehicle}</td>
                    <td className="px-6 py-5 text-slate-600">{log.driver}</td>
                    <td className="px-6 py-5 text-slate-600">{log.liters} L</td>
                    <td className="px-6 py-5 font-semibold text-emerald-600">{formatCurrency(log.cost)}</td>
                    <td className="px-6 py-5 text-slate-600">{formatDate(log.date)}</td>
                    <td className="px-6 py-5">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(log)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(log.id)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingId ? "Edit Fuel Log" : "Add Fuel Log"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId ? "Update fuel consumption details." : "Create a new fuel log for the fleet."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Vehicle</label>
                <select
                  name="vehicleId"
                  value={form.vehicleId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-indigo-500"
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicleName}
                    </option>
                  ))}
                </select>
                {errors.vehicleId ? <p className="mt-2 text-sm text-rose-600">{errors.vehicleId}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Driver</label>
                <input
                  name="driver"
                  value={form.driver}
                  onChange={handleChange}
                  placeholder="Driver name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                />
                {errors.driver ? <p className="mt-2 text-sm text-rose-600">{errors.driver}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Liters</label>
                <input
                  name="liters"
                  type="number"
                  min="0"
                  value={form.liters}
                  onChange={handleChange}
                  placeholder="120"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                />
                {errors.liters ? <p className="mt-2 text-sm text-rose-600">{errors.liters}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Cost</label>
                <input
                  name="cost"
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="8400"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                />
                {errors.cost ? <p className="mt-2 text-sm text-rose-600">{errors.cost}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-indigo-500"
                />
                {errors.date ? <p className="mt-2 text-sm text-rose-600">{errors.date}</p> : null}
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Fuel Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
