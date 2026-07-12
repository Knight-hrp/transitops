import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Smart Transport Operations
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-zinc-900">TransitOps</h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600">
            Fleet, driver, trip, maintenance, and expense management — starting with
            trip dispatch, validations, and smart vehicle recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/trips"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              View Trips
            </Link>
            <Link
              href="/trips/new"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Create Trip
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
