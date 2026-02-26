"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const toastError = (err: any, fallback: string) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return toast.error(detail);
    if (Array.isArray(detail)) return toast.error(detail[0]?.msg || fallback);
    if (typeof detail === "object" && detail !== null) return toast.error(JSON.stringify(detail));
    toast.error(fallback);
};

import { Terminal, Key, Shield, Code, ChevronRight, Copy, Check, Info, Lock } from "lucide-react";

export default function DeveloperPortal() {
    const [generating, setGenerating] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [apiSecret, setApiSecret] = useState("");
    const [consumerName, setConsumerName] = useState("");
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedSecret, setCopiedSecret] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem("admin_token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const generateKeys = async () => {
        if (!consumerName) return toast.error("Foundational identifier missing (Consumer/Bank Name)");
        setGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/external/generate-keys?name=${consumerName}`, {}, getHeaders());
            setApiKey(res.data.api_key);
            setApiSecret(res.data.webhook_secret);
            toast.success("Production API Credentials Minted");
        } catch (err: any) {
            toastError(err, "Cryptographic key generation failed");
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text: string, type: 'key' | 'secret') => {
        navigator.clipboard.writeText(text);
        if (type === 'key') {
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        } else {
            setCopiedSecret(true);
            setTimeout(() => setCopiedSecret(false), 2000);
        }
        toast.success("Copied to clipboard");
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Developer Interface</h1>
                    <p className="text-sm text-slate-500 font-medium mt-2">Managing cryptographic access and integration architecture for external consumers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

                {/* Left: Credential Management */}
                <div className="lg:col-span-2 space-y-8 sticky top-8">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-10 shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Key size={120} />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <h2 className="text-xl font-black flex items-center gap-3">
                                <Shield className="text-purple-400" />
                                Credentials
                            </h2>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed italic">Issue and manage secure access tokens for external entities.</p>
                        </div>

                        {!apiKey ? (
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Consumer/Institution Name</label>
                                    <input
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-white/20"
                                        placeholder="e.g. MORGAN STANLEY MAIN"
                                        value={consumerName}
                                        onChange={e => setConsumerName(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <button
                                    onClick={generateKeys}
                                    disabled={generating}
                                    className="w-full bg-purple-500 text-slate-900 font-black py-5 rounded-2xl shadow-xl hover:bg-purple-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {generating ? <Terminal className="animate-pulse" /> : <Lock size={18} />}
                                    {generating ? "MINTING KEYSPACE..." : "GENERATE PRODUCTION KEYS"}
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">X-API-KEY</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl font-mono text-[10px] text-white break-all leading-relaxed">
                                                {apiKey}
                                            </div>
                                            <button onClick={() => copyToClipboard(apiKey, 'key')} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                                {copiedKey ? <Check className="text-emerald-400" size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">X-SIGNATURE SECRET</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl font-mono text-[10px] text-emerald-400 break-all leading-relaxed">
                                                {apiSecret}
                                            </div>
                                            <button onClick={() => copyToClipboard(apiSecret, 'secret')} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                                {copiedSecret ? <Check className="text-emerald-400" size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-orange-400 font-bold italic mt-2 flex gap-2 items-center">
                                            <Info size={12} />
                                            CRITICAL: Secret is persistent but will not be shown again.
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setApiKey(""); setApiSecret(""); setConsumerName(""); }} className="w-full border border-white/10 text-white/40 hover:text-white hover:border-white/20 py-4 rounded-2xl font-black text-[10px] transition-all uppercase tracking-[0.2em]">Clear Credentials</button>
                            </div>
                        )}
                    </div>

                    <div className="bg-purple-50 rounded-[2rem] p-8 border border-purple-100 space-y-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                            <Shield size={20} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-900">Security Enforcement</p>
                        <p className="text-xs text-purple-800/60 leading-relaxed font-medium italic">Endpoints tagged with <span className="text-purple-600 font-black">HMAC</span> require timestamped hashing for authentication.</p>
                    </div>
                </div>

                {/* Right: Documentation */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                        <div className="p-10 md:p-12 border-b border-slate-50 flex items-center gap-4">
                            <Code className="text-purple-600" />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">API Infrastructure Guide</h2>
                        </div>

                        <div className="p-10 md:p-12 space-y-12">
                            <section className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                                    <div className="h-px bg-slate-100 flex-1" />
                                    Core Directory
                                </h3>
                                <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/30">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white border-b border-slate-50">
                                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Endpoint</th>
                                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Operation</th>
                                                <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {[
                                                { path: "GET /identity/aadhaar/:num", op: "PII Profile Fetch", auth: "JWT" },
                                                { path: "POST /identity/aadhaar", op: "Atomic UID Gen", auth: "JWT" },
                                                { path: "POST /business/register", op: "GSTIN Minting", auth: "JWT" },
                                                { path: "GET /business/company/:gst", op: "Summary Lookup", auth: "JWT" },
                                                { path: "POST /external/v1/credit-evaluate", op: "Production Credit Score", auth: "HMAC", highlight: true },
                                            ].map((row, i) => (
                                                <tr key={i} className="group/row hover:bg-white transition-colors">
                                                    <td className="px-8 py-5">
                                                        <code className={`text-[10px] font-black font-mono tracking-tight ${row.highlight ? 'text-purple-600' : 'text-slate-600'}`}>{row.path}</code>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-xs font-bold text-slate-500 uppercase">{row.op}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border ${row.auth === 'HMAC' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                                            {row.auth}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                                    <div className="h-px bg-slate-100 flex-1" />
                                    Signature Model
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-8 rounded-[2rem] bg-slate-900 text-white space-y-4 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Shield size={64} />
                                        </div>
                                        <h4 className="text-sm font-black text-purple-400 uppercase tracking-widest">Protocol Header</h4>
                                        <ul className="space-y-4 relative z-10">
                                            {['X-API-KEY: Public Key', 'X-TIMESTAMP: Unix Epoch', 'X-SIGNATURE: HMAC HASH'].map((h, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                                    <code className="text-[10px] font-bold font-mono text-slate-300">{h}</code>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 space-y-4">
                                        <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest leading-none">HMAC Equation</h4>
                                        <div className="bg-slate-900 p-6 rounded-2xl space-y-2">
                                            <code className="text-[10px] font-black text-emerald-400 font-mono block">SIGNATURE = HMAC_SHA256(</code>
                                            <code className="text-[10px] font-black text-white font-mono block pl-4">DATA: timestamp + "." + body,</code>
                                            <code className="text-[10px] font-black text-white font-mono block pl-4">SECRET: api_secret</code>
                                            <code className="text-[10px] font-black text-emerald-400 font-mono block">)</code>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                                    <div className="h-px bg-slate-100 flex-1" />
                                    Sample Payload
                                </h3>
                                <div className="bg-slate-900 rounded-[2.5rem] p-10 relative overflow-hidden group">
                                    <div className="absolute top-6 right-10 text-[10px] font-black text-white/20 uppercase tracking-[0.4em] group-hover:text-purple-500/40 transition-colors">JSON INTERFACE</div>
                                    <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto custom-scrollbar">
                                        <code className="text-purple-400">{"{"}</code><br />
                                        <code className="text-slate-500">  "verified": </code> <code className="text-emerald-400">true</code>,<br />
                                        <code className="text-slate-500">  "credit_score": </code> <code className="text-emerald-400">782</code>,<br />
                                        <code className="text-slate-500">  "risk_category": </code> <code className="text-white">"LOW_RISK"</code>,<br />
                                        <code className="text-slate-500">  "granular_scores": </code> <code className="text-purple-400">{"{"}</code><br />
                                        <code className="text-slate-500">    "owner_score": </code> <code className="text-emerald-400">810</code>,<br />
                                        <code className="text-slate-500">    "company_score": </code> <code className="text-emerald-400">760</code>,<br />
                                        <code className="text-slate-500">    "transaction_score": </code> <code className="text-emerald-400">740</code><br />
                                        <code className="text-purple-400">  {"}"},</code><br />
                                        <code className="text-slate-500">  "flags": []</code><br />
                                        <code className="text-purple-400">{"}"}</code>
                                    </pre>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
