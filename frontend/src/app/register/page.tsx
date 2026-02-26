"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Note: We'll modify the backend to allow public registration temporarily or provide a bypass
            await axios.post(`${API_URL}/auth/register`, {
                email,
                password,
                role: "ADMIN"
            });
            toast.success("Account Provisioned Successfully");
            router.push("/login");
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            toast.error(typeof detail === 'string' ? detail : "Registration failed. Public signup might be restricted.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-[3rem] p-10 md:p-12 shadow-2xl space-y-10 border border-slate-100">
                <div className="text-center space-y-3">
                    <div className="h-12 w-12 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">G</div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Authority Access</h1>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Registry Onboarding Portal</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Work Email</label>
                            <input
                                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="name@registry.gov.in"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Access Key</label>
                            <input
                                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 text-[10px] uppercase tracking-[0.2em]"
                    >
                        {loading ? "Provisioning..." : "Request Access"}
                    </button>
                </form>

                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Already have access? <Link href="/login" className="text-emerald-600 hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
}
