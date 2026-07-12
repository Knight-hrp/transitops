import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "Trips" },
  { href: "/trips/new", label: "New Trip" },
];

export default function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          TransitOps
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 transition hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800 transition text-xs font-semibold"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
