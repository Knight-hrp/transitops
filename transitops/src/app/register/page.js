"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role_id: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        // Check password confirmation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Basic password validation
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role_id: Number(formData.role_id),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed");
                return;
            }

            setSuccess("Account created successfully! Redirecting to login...");

            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (error) {
            console.error("Registration error:", error);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        TransitOps
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Create your account
                    </p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} method="POST" className="space-y-5">

                    {/* Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Full Name
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Email Address
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label
                            htmlFor="role_id"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Select Role
                        </label>

                        <select
                            id="role_id"
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Choose a role</option>
                            <option value="1">Fleet Manager</option>
                            <option value="2">Dispatcher</option>
                            <option value="3">Safety Officer</option>
                            <option value="4">Financial Analyst</option>
                        </select>
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Confirm Password
                        </label>

                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Enter password again"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm">
                            {success}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-gray-600 text-sm mt-6">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </main>
    );
}