"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import StatusBadge from "@/components/StatusBadge";

export default function TripDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");

  const loadTrip = useCallback(async () => {
    setLoading(true);
    setError("");
    setErrors([]);
    try {
      const res = await fetch(`/api/trips/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load trip.");
      setTrip(data);
    } catch (err) {
      setError(err.message);
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  async function runAction(action) {
    if (!trip) return;
    setActionLoading(action);
    setError("");
    setErrors([]);
    setNotice("");

    try {
      const res = await fetch(`/api/trips/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (Array.isArray(data.errors) && data.errors.length) {
          setErrors(data.errors);
          setError(data.error || data.errors.join(" "));
        } else {
          setError(data.error || `Failed to ${action} trip.`);
        }
        return;
      }

      setTrip(data);
      setNotice(`Trip ${action} saved to the database.`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading("");
    }
  }

  const canDispatch = trip?.status === "Draft";
  const canComplete = trip?.status === "Dispatched" || trip?.status === "In Progress";
  const canCancel = trip && !["Completed", "Cancelled"].includes(trip.status);
  const isTerminal = trip && ["Completed", "Cancelled"].includes(trip.status);

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/trips" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Back to trips
        </Link>

        {loading ? (
          <p className="mt-6 text-zinc-600">Loading trip…</p>
        ) : error && !trip ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          trip && (
            <>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-zinc-900">
                    {trip.source} → {trip.destination}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-600">Trip #{trip.id}</p>
                </div>
                <StatusBadge status={trip.status} />
              </div>

              <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-zinc-500">Vehicle</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {trip.vehicle?.vehicleName ?? "—"}
                      {trip.vehicle?.status && (
                        <span className="ml-2">
                          <StatusBadge status={trip.vehicle.status} />
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Driver</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {trip.driver?.name ?? "—"}
                      {trip.driver?.status && (
                        <span className="ml-2">
                          <StatusBadge status={trip.driver.status} />
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Cargo Weight</dt>
                    <dd className="mt-1 font-medium text-zinc-900">{trip.cargoWeight} kg</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Planned Distance</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {trip.plannedDistance ? `${trip.plannedDistance} km` : "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              {isTerminal && (
                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                  This trip is {trip.status.toLowerCase()} and cannot be edited.
                </div>
              )}

              {notice && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {notice}
                </div>
              )}

              {(error || errors.length > 0) && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

              <div className="mt-6 flex flex-wrap gap-3">
                {canDispatch && (
                  <button
                    type="button"
                    onClick={() => runAction("dispatch")}
                    disabled={!!actionLoading}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {actionLoading === "dispatch" ? "Dispatching…" : "Dispatch"}
                  </button>
                )}
                {canComplete && (
                  <button
                    type="button"
                    onClick={() => runAction("complete")}
                    disabled={!!actionLoading}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {actionLoading === "complete" ? "Completing…" : "Complete Trip"}
                  </button>
                )}
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => runAction("cancel")}
                    disabled={!!actionLoading}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    {actionLoading === "cancel" ? "Cancelling…" : "Cancel Trip"}
                  </button>
                )}
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
}
