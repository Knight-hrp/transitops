import Link from "next/link";
import AppNav from "@/components/AppNav";
import StatusBadge from "@/components/StatusBadge";
import { MOCK_TRIPS } from "@/lib/mock-data";

export default function TripsPage() {
  const trips = MOCK_TRIPS;

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Trips</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Manage dispatch, completion, and cancellation workflows.
            </p>
          </div>
          <Link
            href="/trips/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Create Trip
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Route</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Driver</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Cargo</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">
                      {trip.source} → {trip.destination}
                    </div>
                    <div className="text-xs text-zinc-500">Trip #{trip.id}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {trip.vehicle?.vehicleName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{trip.driver?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-700">{trip.cargoWeight} kg</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={trip.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
