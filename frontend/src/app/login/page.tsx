"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const toastError = (err: any, fallback: string) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return toast.error(detail);
    if (Array.isArray(detail)) return toast.error(detail[0]?.msg || fallback);
    if (typeof detail === "object" && detail !== null) return toast.error(JSON.stringify(detail));
    toast.error(fallback);
};

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new URLSearchParams();
            // OAuth2PasswordRequestForm expects username and password
            formData.append("username", email);
            formData.append("password", password);

            const res = await axios.post(`${API_URL}/auth/login`, formData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            const token = res.data.access_token;

            // Store in localStorage for this demo (or HttpOnly cookie in prod)
            localStorage.setItem("admin_token", token);

            toast.success("Login successful!");
            router.push("/admin");
        } catch (err: any) {
            toastError(err, "Invalid credentials");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Admin Login
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email" required
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password" required
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <button type="submit" className="w-full bg-emerald-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-emerald-700">
                            Sign in
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
