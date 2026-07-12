"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function RoleGuard({ allow, children }) {
  const allowKey = allow.join(",");
  const [status, setStatus] = useState("loading");
  const [role, setRole] = useState(null);

  useEffect(() => {
    let active = true;
    const allowed = allowKey.split(",");

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const userRole = data?.success ? data.user?.role : null;
        setRole(userRole);
        if (!userRole) setStatus("unauth");
        else if (allowed.includes(userRole)) setStatus("ok");
        else setStatus("denied");
      })
      .catch(() => {
        if (active) setStatus("unauth");
      });

    return () => {
      active = false;
    };
  }, [allowKey]);

  if (status === "ok") return children;

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
        {status === "loading" && (
          <p className="text-zinc-500">Checking authorization…</p>
        )}

        {status === "unauth" && (
          <div className="rounded-xl border border-zinc-200 bg-white p-10 shadow-sm">
            <h1 className="text-xl font-semibold text-zinc-900">
              Sign in required
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              You must be logged in to access trip management.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Go to login
            </Link>
          </div>
        )}

        {status === "denied" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-10 shadow-sm">
            <h1 className="text-xl font-semibold text-red-800">Access denied</h1>
            <p className="mt-2 text-sm text-red-700">
              Your role{role ? ` (${role})` : ""} does not have permission to
              access trip management. This area is restricted to{" "}
              {allow.join(" / ")}.
            </p>
            <Link
              href="/dashboard"
              className="mt-5 inline-block rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Back to dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
