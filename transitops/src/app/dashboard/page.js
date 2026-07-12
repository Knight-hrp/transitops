import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="mt-2 text-zinc-600">
          Fleet analytics dashboard — owned by Teammate 3. Auth-protected view coming
          soon.
        </p>
        <Link href="/trips" className="mt-6 inline-block text-sm font-medium text-zinc-900">
          Go to Trips →
        </Link>
      </main>
    </div>
  );
}
