"use client";

import { useState, useEffect } from "react";
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

import { Search, Building2, TrendingUp, Calendar, ShieldCheck, FileText, ChevronRight, Activity } from "lucide-react";

export default function ReturnsCompliance() {
    const [gstin, setGstin] = useState("");
    const [companyData, setCompanyData] = useState<any>(null);
    const [complianceScore, setComplianceScore] = useState(100);
    const [returns, setReturns] = useState<any[]>([]);
    const [loadingReturns, setLoadingReturns] = useState(false);

    const getHeaders = () => {
        const token = localStorage.getItem("admin_token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const lookupCompany = async () => {
        if (!gstin || gstin.length !== 15) return toast.error("Foundational GSTIN must be exactly 15 characters");
        try {
            const res = await axios.get(`${API_URL}/business/company/${gstin}`, getHeaders());
            setCompanyData(res.data);
            fetchReturns(gstin);
        } catch (err) {
            toastError(err, "Entity not found in national registry");
        }
    };

    const fetchReturns = async (id: string) => {
        setLoadingReturns(true);
        try {
            const res = await axios.get(`${API_URL}/business/company/${id}/returns`, getHeaders());
            setReturns(res.data);
        } catch (err) {
            console.error("Failed to fetch returns", err);
        } finally {
            setLoadingReturns(false);
        }
    };

    const fileReturn = async () => {
        if (!companyData) return;
        try {
            await axios.post(`${API_URL}/business/add-return`, {
                company_id: companyData.id,
                compliance_score: complianceScore
            }, getHeaders());
            toast.success("Governance Record Filed Successfully");
            fetchReturns(gstin);
        } catch (err) {
            toastError(err, "Registry commit failed");
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Returns & Compliance Hub</h1>
                    <p className="text-sm text-slate-500 font-medium mt-2">Managing periodic tax filings and governance scoring for business entities.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex items-center gap-2 max-w-md w-full">
                    <div className="pl-4 text-slate-400">
                        <Search size={18} />
                    </div>
                    <input
                        placeholder="SEARCH GSTIN MAIN FRAME"
                        value={gstin}
                        onChange={e => setGstin(e.target.value.toUpperCase())}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-black tracking-widest text-slate-900 placeholder:text-slate-200"
                        maxLength={15}
                    />
                    <button
                        onClick={lookupCompany}
                        className="bg-emerald-500 text-slate-900 px-6 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/10 hover:bg-emerald-400 transition-all active:scale-95"
                    >
                        FETCH PROFILE
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

                {/* Left Side: Profile & Filing */}
                <div className="lg:col-span-1 space-y-8">
                    {companyData ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                            {/* Entity Card */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Building2 size={120} />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Entity Moniker</p>
                                        <h2 className="text-xl font-black">{companyData.company_name}</h2>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Registry GSTIN</p>
                                        <p className="text-sm font-black font-mono tracking-widest text-emerald-100">{companyData.gst_number}</p>
                                    </div>
                                    <div className="pt-4 flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full animate-pulse ${companyData.is_suspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${companyData.is_suspended ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {companyData.is_suspended ? 'REGISTRY SUSPENDED' : 'ACTIVE COMPLIANCE'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Filing Form */}
                            <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-10 space-y-10">
                                <div className="space-y-4">
                                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                        <TrendingUp className="text-emerald-500" />
                                        Update Compliance
                                    </h2>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed italic">Commit a new governance record to the mainframe.</p>
                                </div>

                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance Score</p>
                                            <p className="text-4xl font-black text-emerald-500">{complianceScore}<span className="text-xs text-slate-300 ml-1">%</span></p>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={complianceScore}
                                            onChange={e => setComplianceScore(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                        />
                                    </div>

                                    <button
                                        onClick={fileReturn}
                                        className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        SEAL & FILE RECORD
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-10 text-center space-y-6 opacity-60">
                            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                                <Building2 size={32} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-black text-slate-900">No Entity Bound</p>
                                <p className="text-xs text-slate-500 font-medium italic">Use the search mainframe to bind a GSTIN application.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: History Ledger */}
                <div className="lg:col-span-2">
                    {companyData ? (
                        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-10 md:p-12 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                        <Activity className="text-emerald-500" />
                                        Governance Ledger
                                    </h2>
                                    <p className="text-slate-500 text-xs font-medium italic">Synchronized historical analysis of entity compliance.</p>
                                </div>
                                <div className="bg-slate-50 px-6 py-2 rounded-full border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{returns.length} RECORDS FOUND</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Filing Timestamp</th>
                                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Governance Score</th>
                                            <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authenticity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {loadingReturns ? (
                                            <tr><td colSpan={3} className="px-10 py-20 text-center text-xs font-black text-slate-300 animate-pulse tracking-widest uppercase">Syncing National Registry...</td></tr>
                                        ) : returns.length === 0 ? (
                                            <tr><td colSpan={3} className="px-10 py-20 text-center text-xs font-medium text-slate-400 italic">No historical records found for this entity.</td></tr>
                                        ) : returns.map((ret) => (
                                            <tr key={ret.id} className="hover:bg-slate-50/50 transition-colors group/row">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar size={16} className="text-slate-400" />
                                                        <p className="text-sm font-bold text-slate-900">{new Date(ret.filed_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-1000 ${ret.compliance_score > 80 ? 'bg-emerald-500' :
                                                                    ret.compliance_score > 50 ? 'bg-orange-400' : 'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${ret.compliance_score}%` }}
                                                            />
                                                        </div>
                                                        <p className={`text-sm font-black font-mono ${ret.compliance_score > 80 ? 'text-emerald-600' :
                                                            ret.compliance_score > 50 ? 'text-orange-600' : 'text-red-600'
                                                            }`}>{ret.compliance_score}%</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                                                        <ShieldCheck size={12} className="text-emerald-600" />
                                                        <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">VERIFIED_SEAL</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-40 text-center space-y-6 group">
                            <div className="h-24 w-24 rounded-[2rem] bg-white shadow-xl flex items-center justify-center mx-auto text-slate-200 group-hover:text-emerald-500 transition-all duration-500 group-hover:rotate-12">
                                <FileText size={40} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-slate-900">Awaiting Search Query</h3>
                                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto italic">Historical ledger and compliance analysis will materialize here upon entity binding.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
