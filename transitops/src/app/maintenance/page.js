"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  vehicleName: "",
  maintenanceType: "",
  description: "",
  cost: "",
  status: "Pending",
  startDate: "",
  endDate: "",
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

export default function Maintenance() {
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
    fetchVehicles();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.vehicle.toLowerCase().includes(search.toLowerCase()) ||
        item.maintenanceType.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All Status" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(() => {
    const completed = items.filter((item) => item.status === "Completed").length;
    const pending = items.filter((item) => item.status === "Pending").length;
    const urgent = items.filter((item) => item.status === "Urgent").length;

    return {
      total: items.length,
      completed,
      pending,
      urgent,
    };
  }, [items]);

  async function fetchData() {
    try {
      const response = await fetch("/api/maintenance");
      const data = await response.json();

      if (data.success) {
        setItems(data.maintenance || []);
      } else {
        setMessage({ type: "error", text: data.message || "Unable to load maintenance data." });
      }
    } catch {
      setMessage({ type: "error", text: "Unable to load maintenance data." });
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehicles() {
    try {
      const response = await fetch("/api/maintenance/vehicles");
      const data = await response.json();

      if (data.success) {
        setVehicles(data.vehicles || []);
      }
    } catch {
      // Ignore vehicle load errors.
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
  }

  function openAddModal() {
    resetForm();
    setForm((current) => ({
      ...current,
      startDate: new Date().toISOString().slice(0, 10),
    }));
    setIsFormOpen(true);
  }

  function openEditModal(item) {
    resetForm();
    setEditingId(item.id);
    setForm({
      vehicleName: item.vehicle || "",
      maintenanceType: item.maintenanceType || "",
      description: item.description || "",
      cost: item.cost ? String(item.cost) : "",
      status: item.status || "Pending",
      startDate: item.startDate ? item.startDate.slice(0, 10) : "",
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
    });
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    resetForm();
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

    if (!form.vehicleName.trim()) {
      nextErrors.vehicleName = "Vehicle is required.";
    }

    if (!form.maintenanceType.trim()) {
      nextErrors.maintenanceType = "Maintenance type is required.";
    }

    if (!form.cost) {
      nextErrors.cost = "Cost is required.";
    } else if (Number(form.cost) <= 0) {
      nextErrors.cost = "Cost must be greater than zero.";
    }

    if (!form.startDate) {
      nextErrors.startDate = "Start date is required.";
    }

    if (!form.status) {
      nextErrors.status = "Status is required.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage({ type: "error", text: "Please fix the highlighted fields." });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        vehicleName: form.vehicleName.trim(),
        maintenanceType: form.maintenanceType.trim(),
        description: form.description.trim(),
        cost: Number(form.cost),
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate || null,
      };

      const response = await fetch(editingId ? `/api/maintenance/${editingId}` : "/api/maintenance", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: editingId ? "Maintenance updated successfully." : "Maintenance created successfully.",
        });
        await fetchData();
        await fetchVehicles();
        closeForm();
      } else {
        setMessage({ type: "error", text: data.message || "Unable to save maintenance." });
        setErrors(data.errors || {});
      }
    } catch {
      setMessage({ type: "error", text: "Unable to save maintenance." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this maintenance record?");
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Maintenance deleted successfully." });
        await fetchData();
      } else {
        setMessage({ type: "error", text: data.message || "Unable to delete maintenance." });
      }
    } catch {
      setMessage({ type: "error", text: "Unable to delete maintenance." });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-8 py-10">
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">Maintenance</h1>
            <p className="mt-2 text-slate-500">
              Monitor and manage all vehicle maintenance activities.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            + Add Maintenance
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

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Total Jobs</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-800">{stats.total}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Completed</p>
            <h2 className="mt-3 text-4xl font-bold text-green-600">{stats.completed}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Pending</p>
            <h2 className="mt-3 text-4xl font-bold text-yellow-500">{stats.pending}</h2>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vehicle or maintenance..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 outline-none focus:border-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3"
          >
            <option>All Status</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Urgent</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr className="text-left text-slate-600">
                <th className="px-6 py-5">Vehicle</th>
                <th className="px-6 py-5">Maintenance</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Cost</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                    Loading maintenance records...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="border-t transition hover:bg-slate-50">
                    <td className="px-6 py-5 font-medium text-slate-700">🚚 {item.vehicle}</td>
                    <td className="px-6 py-5 text-slate-600">{item.maintenanceType}</td>
                    <td className="px-6 py-5 text-slate-600">{formatDate(item.startDate)}</td>
                    <td className="px-6 py-5 font-semibold text-slate-700">{formatCurrency(item.cost)}</td>
                    <td className="px-6 py-5">
                      {item.status === "Completed" && (
                        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                          ● Completed
                        </span>
                      )}

                      {item.status === "Pending" && (
                        <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                          ● Pending
                        </span>
                      )}

                      {item.status === "Urgent" && (
                        <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                          ● Urgent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-blue-100"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg bg-slate-100 px-3 py-2 hover:bg-red-100"
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
                  {editingId ? "Edit Maintenance" : "Add Maintenance"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId ? "Update the maintenance record below." : "Create a new maintenance task for your fleet."}
                </p>
              </div>

              <button onClick={closeForm} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Vehicle</label>
                <input
                  name="vehicleName"
                  value={form.vehicleName}
                  onChange={handleChange}
                  list="vehicle-options"
                  placeholder="Enter vehicle name"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
                <datalist id="vehicle-options">
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.vehicleName} />
                  ))}
                </datalist>
                {errors.vehicleName ? <p className="mt-2 text-sm text-rose-600">{errors.vehicleName}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Maintenance Type</label>
                <input
                  name="maintenanceType"
                  value={form.maintenanceType}
                  onChange={handleChange}
                  placeholder="Oil Change"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
                {errors.maintenanceType ? <p className="mt-2 text-sm text-rose-600">{errors.maintenanceType}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Add details about the maintenance work"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Cost</label>
                <input
                  name="cost"
                  type="number"
                  min="0"
                  value={form.cost}
                  onChange={handleChange}
                  placeholder="2500"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
                {errors.cost ? <p className="mt-2 text-sm text-rose-600">{errors.cost}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Urgent">Urgent</option>
                </select>
                {errors.status ? <p className="mt-2 text-sm text-rose-600">{errors.status}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-blue-500"
                />
                {errors.startDate ? <p className="mt-2 text-sm text-rose-600">{errors.startDate}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">End Date</label>
                <input
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-blue-500"
                />
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
                  className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Maintenance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}