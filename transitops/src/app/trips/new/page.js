"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import RoleGuard from "@/components/RoleGuard";

const TRIP_ROLES = ["Dispatcher"];

export default function NewTripPage() {
  return (
    <RoleGuard allow={TRIP_ROLES}>
      <NewTripForm />
    </RoleGuard>
  );
}

function NewTripForm() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [form, setForm] = useState({
    source: "",
    destination: "",
    cargoWeight: "",
    plannedDistance: "",
    vehicleId: "",
    driverId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles/available").then((r) => r.json()),
      fetch("/api/drivers/available").then((r) => r.json()),
    ])
      .then(([vehicleData, driverData]) => {
        if (Array.isArray(vehicleData)) setVehicles(vehicleData);
        if (Array.isArray(driverData)) setDrivers(driverData);
      })
      .catch(() => setError("Failed to load available vehicles and drivers."))
      .finally(() => setLoadingOptions(false));
  }, []);

  useEffect(() => {
    const weight = Number(form.cargoWeight);
    if (!weight || weight <= 0) {
      setRecommendation(null);
      setAlternatives([]);
      return;
    }

    let cancelled = false;
    setRecLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/trips/recommend?cargoWeight=${weight}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setRecommendation(data.recommendation ?? null);
          setAlternatives(Array.isArray(data.alternatives) ? data.alternatives : []);
        })
        .catch(() => {
          if (!cancelled) {
            setRecommendation(null);
            setAlternatives([]);
          }
        })
        .finally(() => {
          if (!cancelled) setRecLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.cargoWeight]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => String(vehicle.id) === String(form.vehicleId)),
    [vehicles, form.vehicleId],
  );

  const capacityWarning =
    selectedVehicle &&
    form.cargoWeight &&
    Number(form.cargoWeight) > Number(selectedVehicle.maxLoadCapacity)
      ? `Cargo (${form.cargoWeight} kg) exceeds ${selectedVehicle.vehicleName} capacity (${selectedVehicle.maxLoadCapacity} kg).`
      : "";

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setErrors([]);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cargoWeight: Number(form.cargoWeight),
          plannedDistance: form.plannedDistance
            ? Number(form.plannedDistance)
            : undefined,
          vehicleId: form.vehicleId ? Number(form.vehicleId) : undefined,
          driverId: form.driverId ? Number(form.driverId) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data.errors) && data.errors.length) {
          setErrors(data.errors);
          setError(data.error || data.errors.join(" "));
        } else {
          setError(data.error || "Failed to create trip.");
        }
        return;
      }

      router.push(`/trips/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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

          {Number(form.cargoWeight) > 0 && (
            <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
                <span aria-hidden>✨</span> Smart Dispatch Recommendation
              </h2>
              {recLoading ? (
                <p className="text-sm text-indigo-700">Scoring available vehicles…</p>
              ) : recommendation ? (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-zinc-900">
                        {recommendation.vehicle.vehicleName}
                        <span className="ml-2 text-sm font-normal text-zinc-500">
                          {recommendation.vehicle.registrationNumber}
                        </span>
                      </p>
                      <p className="text-xs text-zinc-500">
                        Capacity {recommendation.vehicle.maxLoadCapacity} kg · Match score{" "}
                        {recommendation.score}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateField("vehicleId", String(recommendation.vehicle.id))
                      }
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      {String(form.vehicleId) === String(recommendation.vehicle.id)
                        ? "✓ Selected"
                        : "Use Recommended"}
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {recommendation.reasons.map((reason) => (
                      <li key={reason} className="flex items-center gap-2 text-sm text-zinc-700">
                        <span className="text-emerald-600" aria-hidden>
                          ✓
                        </span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                  {alternatives.length > 0 && (
                    <div className="mt-4 border-t border-indigo-200 pt-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-500">
                        Alternatives
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {alternatives.map((alt) => (
                          <button
                            key={alt.vehicle.id}
                            type="button"
                            onClick={() => updateField("vehicleId", String(alt.vehicle.id))}
                            className="rounded-full border border-indigo-300 bg-white px-3 py-1 text-xs text-zinc-700 hover:border-indigo-500"
                          >
                            {alt.vehicle.vehicleName} · {alt.score}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-indigo-700">
                  No available vehicle can carry {form.cargoWeight} kg right now.
                </p>
              )}
            </section>
          )}

          <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Assignment
            </h2>
            {loadingOptions ? (
              <p className="text-sm text-zinc-600">Loading available fleet…</p>
            ) : (
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
                    {vehicles.map((vehicle) => (
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
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            {capacityWarning && (
              <p className="mt-3 text-sm text-amber-700">{capacityWarning}</p>
            )}
          </section>

          {(error || errors.length > 0) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5">
                  {errors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                error
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || loadingOptions || !!capacityWarning}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create Trip"}
          </button>
        </form>
      </main>
    </div>
  );
}
