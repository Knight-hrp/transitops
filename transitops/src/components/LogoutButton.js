"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        setLoading(true);

        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch {
            // Ignore errors — we still want to redirect
        } finally {
            router.push("/login");
            router.refresh();
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed rounded-lg transition"
        >
            {loading ? "Signing out…" : "Sign Out"}
        </button>
    );
}
