"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

const CTA_BY_PAGE = {
  trips: { href: "/trips", label: "View Trips", primary: true },
  new_trip: { href: "/trips/new", label: "Create Trip", primary: false },
  vehicles: { href: "/vehicles", label: "Manage Vehicles", primary: true },
  drivers: { href: "/drivers", label: "Manage Drivers", primary: false },
  maintenance: { href: "/maintenance", label: "Maintenance", primary: false },
  fuel: { href: "/fuel", label: "Fuel Logs", primary: false },
  expenses: { href: "/expenses", label: "Expenses", primary: false },
  dashboard: { href: "/dashboard", label: "Open Dashboard", primary: true },
  analytics: { href: "/analytics", label: "Analytics", primary: false },
  safety: { href: "/safety", label: "Safety", primary: false },
};

export default function HomeCTAs() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setUser(data?.success ? data.user : null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="mt-8 text-sm text-zinc-500">Loading shortcuts…</p>;
  }

  if (!user) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          Register
        </Link>
      </div>
    );
  }

  const pages = ROLE_PERMISSIONS[user.role]?.pages ?? [];
  const preferredOrder = [
    "trips",
    "new_trip",
    "dashboard",
    "vehicles",
    "drivers",
    "maintenance",
    "fuel",
    "expenses",
    "analytics",
    "safety",
  ];
  const ctas = preferredOrder
    .filter((page) => pages.includes(page))
    .map((page) => CTA_BY_PAGE[page])
    .filter(Boolean)
    .slice(0, 3);

  if (ctas.length === 0) {
    return (
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Open Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {ctas.map((cta) => (
        <Link
          key={cta.href}
          href={cta.href}
          className={
            cta.primary
              ? "rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
              : "rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          }
        >
          {cta.label}
        </Link>
      ))}
    </div>
  );
}
