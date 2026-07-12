"use client";

import { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { MOCK_DRIVERS, MOCK_VEHICLES } from "@/lib/mock-data";

export default function NewTripPage() {
  const [form, setForm] = useState({
    source: "",
    destination: "",
    cargoWeight: "",
    plannedDistance: "",
    vehicleId: "",
    driverId: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link href="/trips" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← Back to trips
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Create Trip</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Route Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Source</span>
                <input
                  required
                  value={form.source}
                  onChange={(e) => updateField("source", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                  placeholder="Mumbai Warehouse"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Destination</span>
                <input
                  required
                  value={form.destination}
                  onChange={(e) => updateField("destination", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                  placeholder="Pune Distribution Center"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Cargo Weight (kg)</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.cargoWeight}
                  onChange={(e) => updateField("cargoWeight", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                  placeholder="450"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">
                  Planned Distance (km)
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.plannedDistance}
                  onChange={(e) => updateField("plannedDistance", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                  placeholder="150"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Assignment
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Vehicle</span>
                <select
                  required
                  value={form.vehicleId}
                  onChange={(e) => updateField("vehicleId", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value="">Select vehicle</option>
                  {MOCK_VEHICLES.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicleName} ({vehicle.maxLoadCapacity} kg)
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Driver</span>
                <select
                  required
                  value={form.driverId}
                  onChange={(e) => updateField("driverId", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                >
                  <option value="">Select driver</option>
                  {MOCK_DRIVERS.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {submitted && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Trip form submitted (mock). Database integration comes in the next phase.
            </div>
          )}

          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create Trip
          </button>
        </form>
      </main>
    </div>
  );
}
