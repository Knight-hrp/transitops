import Link from "next/link";
import AppNav from "@/components/AppNav";
import StatusBadge from "@/components/StatusBadge";
import { serializeTrip, TRIP_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const TRIP_ROLES = ["Dispatcher"];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: TRIP_STATUS.DRAFT, label: "Draft" },
  { key: TRIP_STATUS.DISPATCHED, label: "Dispatched" },
  { key: TRIP_STATUS.IN_PROGRESS, label: "In Progress" },
  { key: TRIP_STATUS.COMPLETED, label: "Completed" },
  { key: TRIP_STATUS.CANCELLED, label: "Cancelled" },
];

async function getTrips(status) {
  const trips = await prisma.trip.findMany({
    where: status && status !== "all" ? { status } : undefined,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });
  return trips.map(serializeTrip);
}

export default async function TripsPage({ searchParams }) {
  const user = await getSessionUser();

  if (!user || !TRIP_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <AppNav />
        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 p-10 shadow-sm">
            <h1 className="text-xl font-semibold text-red-800">
              {user ? "Access denied" : "Sign in required"}
            </h1>
            <p className="mt-2 text-sm text-red-700">
              {user
                ? `Your role (${user.role}) does not have permission to access trip management. This area is restricted to ${TRIP_ROLES.join(
                    " / ",
                  )}.`
                : "You must be logged in as a Dispatcher to access trip management."}
            </p>
            <Link
              href={user ? "/dashboard" : "/login"}
              className="mt-5 inline-block rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              {user ? "Back to dashboard" : "Go to login"}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const params = (await searchParams) ?? {};
  const activeStatus =
    typeof params.status === "string" ? params.status : "all";
  const trips = await getTrips(activeStatus);

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

        <div className="mb-5 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeStatus === filter.key;
            const href =
              filter.key === "all" ? "/trips" : `/trips?status=${filter.key}`;
            return (
              <Link
                key={filter.key}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {trips.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            {activeStatus === "all" ? (
              <>
                <p className="text-zinc-600">No trips yet.</p>
                <Link
                  href="/trips/new"
                  className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline"
                >
                  Create your first trip
                </Link>
              </>
            ) : (
              <>
                <p className="text-zinc-600">
                  No trips with status &ldquo;{activeStatus}&rdquo;.
                </p>
                <Link
                  href="/trips"
                  className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline"
                >
                  View all trips
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Route</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Vehicle</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Driver</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Cargo</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Distance</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-zinc-600">Actions</th>
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
                    <td className="px-4 py-3 text-zinc-700">
                      {trip.plannedDistance ? `${trip.plannedDistance} km` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={trip.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="font-medium text-zinc-900 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
