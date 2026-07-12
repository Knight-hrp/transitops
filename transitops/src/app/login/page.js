import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900">Login</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Authentication UI is in progress. Use the API routes at{" "}
          <code className="rounded bg-zinc-100 px-1">/api/auth/login</code> for now.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-zinc-900">
          ← Back home
        </Link>
      </main>
    </div>
  );
}
