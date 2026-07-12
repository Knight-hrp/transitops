"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const emptyForm = {
  vehicleId: "",
  expenseType: "",
  amount: "",
  description: "",
  date: "",
};

const EXPENSE_TYPES = [
  "Insurance",
  "Repair",
  "Toll",
  "Fuel",
  "Tyres",
  "Maintenance",
  "Spare Parts",
  "Permit",
  "Miscellaneous",
];

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

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const vehicleRef = useRef(null);

  useEffect(() => {
    fetchExpenses();
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (message.text && message.type === "success") {
      const timeout = setTimeout(() => setMessage({ type: "", text: "" }), 2000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [message]);

  const filteredExpenses = useMemo(() => {
    const searchText = search.toLowerCase();
    return expenses.filter((expense) => {
      return (
        expense.vehicle.toLowerCase().includes(searchText) ||
        expense.expenseType.toLowerCase().includes(searchText) ||
        (expense.description || "").toLowerCase().includes(searchText)
      );
    });
  }, [expenses, search]);

  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  async function fetchExpenses() {
    try {
      const response = await fetch("/api/expenses");
      const data = await response.json();
      if (data.success) {
        setExpenses(data.expenses || []);
      } else {
        setMessage({ type: "error", text: data.message || "Unable to load expenses." });
      }
    } catch {
      setMessage({ type: "error", text: "Unable to load expenses." });
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehicles() {
    try {
      const response = await fetch("/api/expenses/vehicles");
      const data = await response.json();
      if (data.success) {
        setVehicles(data.vehicles || []);
      }
    } catch {
      // ignore vehicle fetch errors
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setErrors({});
    setEditingId(null);
  }

  function openAddModal() {
    resetForm();
    setForm((current) => ({ ...current, date: new Date().toISOString().slice(0, 10) }));
    setIsFormOpen(true);
  }

  function openEditModal(expense) {
    setEditingId(expense.id);
    setForm({
      vehicleId: expense.vehicleId || "",
      expenseType: expense.expenseType || "",
      amount: expense.amount ? String(expense.amount) : "",
      description: expense.description || "",
      date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : "",
    });
    setErrors({});
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

    if (!form.vehicleId) {
      nextErrors.vehicleId = "Vehicle is required.";
    }
    if (!form.expenseType.trim()) {
      nextErrors.expenseType = "Expense type is required.";
    }
    if (form.amount === "" || Number(form.amount) <= 0) {
      nextErrors.amount = "Amount must be greater than zero.";
    }
    if (!form.date) {
      nextErrors.date = "Date is required.";
    }

    const duplicateExpense = expenses.find((expense) => {
      if (!form.vehicleId || !form.expenseType.trim()) {
        return false;
      }
      if (editingId && expense.id === editingId) {
        return false;
      }
      return (
        String(expense.vehicleId) === String(form.vehicleId) &&
        String(expense.expenseType).trim().toLowerCase() === form.expenseType.trim().toLowerCase()
      );
    });

    if (duplicateExpense) {
      nextErrors.expenseType = "This expense type has already been recorded for the selected vehicle.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage({ type: "error", text: "" });
      const targetRef = nextErrors.expenseType ? vehicleRef.current : null;
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: "smooth", block: "center" });
        targetRef.focus && targetRef.focus();
      }
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehicleId: Number(form.vehicleId),
        expenseType: form.expenseType.trim(),
        amount: Number(form.amount),
        description: form.description.trim() || null,
        date: form.date,
      };

      const response = await fetch(editingId ? `/api/expenses/${editingId}` : "/api/expenses", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: editingId ? "Expense updated successfully." : "Expense created successfully." });
        await fetchExpenses();
        closeForm();
      } else {
        setMessage({ type: "error", text: data.message || "Unable to save expense." });
        setErrors(data.errors || {});
        const shouldScroll = data.errors?.vehicleId || (data.message && data.message.toLowerCase().includes("vehicle"));
        if (shouldScroll && vehicleRef.current) {
          vehicleRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          vehicleRef.current.focus && vehicleRef.current.focus();
        }
      }
    } catch {
      setMessage({ type: "error", text: "Unable to save expense." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this expense record?")) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Expense deleted successfully." });
        await fetchExpenses();
      } else {
        setMessage({ type: "error", text: data.message || "Unable to delete expense." });
      }
    } catch {
      setMessage({ type: "error", text: "Unable to delete expense." });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
              Fleet Expenses
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Expenses</h1>
            <p className="mt-2 text-slate-600">Track operational expenses across your fleet.</p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700 hover:shadow-md"
          >
            + Add Expense
          </button>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Expenses</p>
            <h2 className="mt-3 text-3xl font-semibold text-rose-600">{formatCurrency(totalAmount)}</h2>
            <p className="mt-2 text-sm text-slate-500">Fleet-wide spend</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Expense Records</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">{expenses.length}</h2>
            <p className="mt-2 text-sm text-slate-500">All recorded expenses</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Average Expense</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">
              {expenses.length > 0 ? formatCurrency(totalAmount / expenses.length) : "—"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">Per record average</p>
          </div>
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vehicle, type or description..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-700 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-600">
                <th className="px-6 py-5">Vehicle</th>
                <th className="px-6 py-5">Expense Type</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                    <td className="px-6 py-5 font-semibold text-slate-800">🚚 {expense.vehicle}</td>
                    <td className="px-6 py-5 text-slate-600">{expense.expenseType}</td>
                    <td className="px-6 py-5 font-semibold text-rose-600">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-5 text-slate-600">{formatDate(expense.date)}</td>
                    <td className="px-6 py-5 text-slate-600">{expense.description || "—"}</td>
                    <td className="px-6 py-5">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(expense)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(expense.id)}
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingId ? "Edit Expense" : "Add Expense"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId ? "Update the expense record below." : "Register a new expense for your fleet."}
                </p>
              </div>

              <button onClick={closeForm} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
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
                  ref={vehicleRef}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-rose-500"
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Expense Type</label>
                <select
                  name="expenseType"
                  value={form.expenseType}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-rose-500"
                >
                  <option value="">Select expense type</option>
                  {EXPENSE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.expenseType ? <p className="mt-2 text-sm text-rose-600">{errors.expenseType}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Optional details about the expense"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="12500"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-rose-500"
                />
                {errors.amount ? <p className="mt-2 text-sm text-rose-600">{errors.amount}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-rose-500"
                />
                {errors.date ? <p className="mt-2 text-sm text-rose-600">{errors.date}</p> : null}
              </div>

              {message.text ? (
                <div className={`md:col-span-2 rounded-2xl border px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}>
                  {message.text}
                </div>
              ) : null}

              <div className="md:col-span-2 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
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
                  className="rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
