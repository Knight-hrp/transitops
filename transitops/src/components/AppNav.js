"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

const PAGE_LINKS = {
  dashboard: { href: "/dashboard", label: "Dashboard" },
  trips: { href: "/trips", label: "Trips" },
  new_trip: { href: "/trips/new", label: "New Trip" },
  vehicles: { href: "/vehicles", label: "Vehicles" },
  drivers: { href: "/drivers", label: "Drivers" },
  maintenance: { href: "/maintenance", label: "Maintenance" },
  fuel: { href: "/fuel", label: "Fuel" },
  expenses: { href: "/expenses", label: "Expenses" },
};

export default function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
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
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors; still redirect to login
    }
    setUser(null);
    router.push("/login");
    router.refresh();
  }

  const pages = user ? ROLE_PERMISSIONS[user.role]?.pages ?? [] : [];
  const links = pages
    .map((page) => PAGE_LINKS[page])
    .filter(Boolean);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          TransitOps
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link
            href="/"
            className={
              pathname === "/"
                ? "text-zinc-900"
                : "text-zinc-600 transition hover:text-zinc-900"
            }
          >
            Home
          </Link>

          {links.map((link) => {
            const active =
              link.href === "/trips"
                ? pathname === "/trips"
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "text-zinc-900"
                    : "text-zinc-600 transition hover:text-zinc-900"
                }
              >
                {link.label}
              </Link>
            );
          })}

          {loading ? (
            <span className="text-xs text-zinc-400">…</span>
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-zinc-500 sm:inline">
                {user.name}
                <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600">
                  {user.role}
                </span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-800"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
