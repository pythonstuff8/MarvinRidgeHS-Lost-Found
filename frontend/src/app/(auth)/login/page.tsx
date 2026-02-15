"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            await login(username, password);
        } catch (err: any) {
            setError("Invalid credentials. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md space-y-8 bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-200">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-fbla-blue mb-2">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to manage lost items</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center border border-red-200">{error}</div>}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-fbla-blue/20 outline-none transition-all"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-fbla-blue/20 outline-none transition-all"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-xl bg-fbla-blue text-white font-bold hover:bg-blue-800 transition-all flex items-center justify-center"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-fbla-orange hover:underline font-bold">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
