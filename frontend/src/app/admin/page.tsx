"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import { LayoutDashboard, Users, CreditCard, Landmark, ShieldAlert, Activity, ArrowUpRight, ShieldCheck, Zap } from "lucide-react";

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>({
        aadhaar_count: 0,
        pan_count: 0,
        gst_count: 0,
        invoices: 0,
        system_load: "Optimal",
        security_breaches: 0
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Registration Form State
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regLoading, setRegLoading] = useState(false);
    const [showRegModal, setShowRegModal] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem("admin_token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const fetchData = async () => {
        try {
            const [statsRes, logsRes] = await Promise.all([
                axios.get(`${API_URL}/admin/stats`, getHeaders()),
                axios.get(`${API_URL}/admin/logs`, getHeaders())
            ]);
            setStats(statsRes.data);
            setLogs(logsRes.data);
        } catch (err) {
            console.error("Dashboard sync failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegLoading(true);
        try {
            await axios.post(`${API_URL}/auth/register`, {
                email: regEmail,
                password: regPassword,
                role: "ADMIN"
            }, getHeaders());
            toast.success("New Authority Member Onboarded");
            setRegEmail("");
            setRegPassword("");
            setShowRegModal(false);
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            toast.error(typeof detail === 'string' ? detail : "Registration failed");
        } finally {
            setRegLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.push("/login");
            return;
        }
        fetchData();
    }, [router]);

    const statCards = [
        { label: "Aadhaar Registry", value: stats.aadhaar_count, icon: <Users size={24} />, color: "emerald", trend: "+12%" },
        { label: "PAN Repository", value: stats.pan_count, icon: <CreditCard size={24} />, color: "blue", trend: "+5%" },
        { label: "Corporate GSTINs", value: stats.gst_count, icon: <Landmark size={24} />, color: "purple", trend: "+2%" },
        { label: "Compliance Records", value: stats.invoices, icon: <Zap size={24} />, color: "orange", trend: "+18%" },
    ];

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 pb-20">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        Authority Control Center
                    </h1>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">Registry_Online</p>
                        </div>
                        <div className="h-4 w-px bg-slate-200" />
                        <p className="text-xs text-slate-500 font-medium italic">Live synchronization with National Data Mainframe.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="px-6 py-2 bg-slate-900 rounded-xl">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Global Status</p>
                        <p className="text-xs font-black text-emerald-400">NOMINAL_OPERATIONS</p>
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((card, idx) => (
                    <div key={idx} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] transition-all duration-500 group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 p-8 text-${card.color}-500/5 group-hover:scale-110 transition-transform duration-500`}>
                            {card.icon}
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className={`h-14 w-14 rounded-2xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600 border border-${card.color}-100 shadow-sm`}>
                                {card.icon}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                                <div className="flex items-end gap-3">
                                    <p className="text-4xl font-black text-slate-900">{card.value}</p>
                                    <span className={`text-[10px] font-black text-${card.color}-600 underline decoration-2 underline-offset-4 flex items-center gap-1 mb-1`}>
                                        {card.trend} <ArrowUpRight size={10} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Advanced Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-stretch">
                {/* Audit Terminal */}
                <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] shadow-2xl p-10 md:p-12 space-y-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-white pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700">
                        <Activity size={320} />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white flex items-center gap-4">
                                <span className="h-6 w-1.5 bg-emerald-500 rounded-full" />
                                Real-time Audit Flow
                            </h2>
                            <p className="text-slate-500 text-xs font-medium italic">Immutable transaction logging from registry authorities.</p>
                        </div>
                        <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">LIVE_FEED</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {loading ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intercepting Feed...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="py-20 text-center opacity-30 italic text-slate-500 text-sm">No recent authority logs recorded.</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between bg-white/5 hover:bg-white/10 p-6 rounded-3xl border border-white/5 transition-all group/item cursor-default">
                                    <div className="flex items-center gap-6">
                                        <div className={`h-2 w-2 rounded-full bg-${log.color}-500 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover/item:scale-150 transition-transform`} />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-300">
                                                <span className="text-white font-black font-mono mr-2">{log.actor}</span> {log.action}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.code}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase mt-4 md:mt-0 opacity-40 group-hover/item:opacity-100 transition-opacity tracking-widest">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )
                            ))}
                    </div>
                </div>

                {/* Health & Security Panel */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-10 md:p-12 flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:rotate-12 transition-transform duration-700">
                        <ShieldAlert size={160} />
                    </div>

                    <div className="space-y-10 relative z-10">
                        <div className="space-y-6">
                            <div className="h-16 w-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                                <ShieldCheck size={28} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Health Integrity</h3>
                                <p className="text-slate-500 text-xs font-medium leading-relaxed italic">System-wide diagnostic reports for identity infrastructure.</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {[
                                { label: "HSM Module Status", status: "Secure", color: "emerald" },
                                { label: "Registry Latency", status: "14ms", color: "emerald" },
                                { label: "Anomaly Detection", status: "0 Found", color: "emerald" },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center group/h">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-1.5 w-1.5 rounded-full bg-${item.color}-500`} />
                                        <span className={`text-sm font-black text-${item.color}-600`}>{item.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-10 relative z-10">
                        <button
                            onClick={() => setShowRegModal(true)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-3xl border border-slate-900 shadow-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest"
                        >
                            Onboard New Member
                        </button>
                    </div>

                    {/* Registration Modal */}
                    {showRegModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 border border-slate-100">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900">Authority Onboarding</h3>
                                    <p className="text-xs text-slate-500 font-medium">Provisioning access to higher-tier identity infrastructure.</p>
                                </div>

                                <form onSubmit={handleRegister} className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Member Email</label>
                                            <input
                                                type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none"
                                                placeholder="authority@registry.gov"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Access Key</label>
                                            <input
                                                type="password" required value={regPassword} onChange={e => setRegPassword(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button" onClick={() => setShowRegModal(false)}
                                            className="flex-1 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={regLoading}
                                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {regLoading ? "Provisioning..." : "Onboard"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
