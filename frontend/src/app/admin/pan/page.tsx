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

import { X, FileText, Link2, ShieldCheck, Send, CheckCircle2 } from "lucide-react";

export default function PANRegistry() {
    const [step, setStep] = useState(1);
    const [searchAadhaar, setSearchAadhaar] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [aadhaarData, setAadhaarData] = useState<any>(null);
    const [otp, setOtp] = useState("");
    const [devOtp, setDevOtp] = useState("");
    const [generatedPan, setGeneratedPan] = useState("");

    const getHeaders = () => {
        const token = localStorage.getItem("admin_token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handleSearch = async (val: string) => {
        setSearchAadhaar(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await axios.get(`${API_URL}/identity/search/aadhaar?query=${val}&unlinked_pan=true`, getHeaders());
            setSearchResults(res.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setSearching(false);
        }
    };

    const selectAadhaar = (profile: any) => {
        setAadhaarData(profile);
        setStep(2);
    };

    const fetchAadhaar = async () => {
        if (!searchAadhaar || searchAadhaar.length !== 12) return toast.error("Foundational ID must be exactly 12 digits");
        try {
            const res = await axios.get(`${API_URL}/identity/aadhaar/${searchAadhaar}`, getHeaders());
            if (res.data.blacklist_flag) return toast.error("Aadhaar Flagged: Security Blacklist active for this UID");

            // Re-verify if PAN already exists for this Aadhaar
            try {
                await axios.get(`${API_URL}/identity/pan/${res.data.aadhaar_number}`, getHeaders());
                return toast.error("PAN already linked to this Aadhaar profile");
            } catch (e) { }

            setAadhaarData(res.data);
            setStep(2);
        } catch (err: any) {
            toastError(err, "UID not found in primary registry");
        }
    };

    const sendOtp = async () => {
        try {
            const res = await axios.post(`${API_URL}/identity/generate-otp`, {
                identity_value: aadhaarData.phone,
                identity_type: "PHONE"
            }, getHeaders());
            toast.success(`OTP routed to linked mobile device`);
            if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
            setStep(3);
        } catch (err: any) {
            toastError(err, "OTP routing failed");
        }
    };

    const verifyAndGenerate = async () => {
        try {
            await axios.post(`${API_URL}/identity/verify-otp`, {
                identity_value: aadhaarData.phone,
                identity_type: "PHONE",
                otp: otp
            }, getHeaders());

            const res = await axios.post(`${API_URL}/identity/pan`, {
                aadhaar_number: aadhaarData.aadhaar_number
            }, getHeaders());

            toast.success(`PAN Identity Minted Successfully`);
            setGeneratedPan(res.data.pan_number);
            setStep(4);
        } catch (err: any) {
            toastError(err, "Final authorization failed");
        }
    };

    const downloadDocument = async () => {
        try {
            const res = await axios.get(`${API_URL}/documents/pan/${generatedPan}`, getHeaders());
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(res.data);
                newWindow.document.close();
            }
        } catch (err: any) {
            toastError(err, "Document synthesis failed");
        }
    };

    const steps = [
        { id: 1, label: "Aadhaar Link", icon: <Link2 size={18} /> },
        { id: 2, label: "Identity Sync", icon: <ShieldCheck size={18} /> },
        { id: 3, label: "Verification", icon: <Send size={18} /> },
        { id: 4, label: "PAN Minting", icon: <CheckCircle2 size={18} /> }
    ];

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">PAN Issuance Authority</h1>
                <p className="text-sm text-slate-500 font-medium mt-2">Connecting tax registries with foundational Aadhaar identities.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">

                {/* Visual Progress Map */}
                <div className="lg:w-1/3">
                    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-8 space-y-8">
                        {steps.map((s) => (
                            <div key={s.id} className="flex items-center gap-6 group">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step === s.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' :
                                    step > s.id ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-50 text-slate-300'
                                    }`}>
                                    {step > s.id ? <CheckCircle2 size={24} /> : s.icon}
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${step === s.id ? 'text-indigo-600' : 'text-slate-400'}`}>Phase 0{s.id}</p>
                                    <p className={`text-sm font-bold ${step === s.id ? 'text-slate-900' : 'text-slate-500'}`}>{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 bg-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldCheck size={120} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Authority Note</p>
                        <p className="text-xs text-indigo-100/60 leading-relaxed font-medium">Registry linkage requires atomic verification. Ensure target mobile device is active for cryptographic handshakes.</p>
                    </div>
                </div>

                {/* Operations Center */}
                <div className="lg:w-2/3">
                    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-10 md:p-16 min-h-[500px] flex flex-col justify-center">

                        {step === 1 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Identity Bridge</h2>
                                    <p className="text-slate-500 font-medium">Search by Name or enter 12-digit Aadhaar to link identity.</p>
                                </div>
                                <div className="relative">
                                    <input
                                        placeholder="Search Name or Enter UID..."
                                        value={searchAadhaar}
                                        onChange={e => handleSearch(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-[2rem] py-8 px-10 text-xl md:text-2xl font-black tracking-tight text-slate-900 focus:ring-0 focus:bg-white focus:shadow-inner transition-all placeholder:text-slate-200"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-400">
                                        <Link2 size={24} />
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 max-h-[300px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                            {searchResults.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => selectAadhaar(p)}
                                                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50 rounded-2xl transition-all group text-left"
                                                >
                                                    <div>
                                                        <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest mt-1">UID: {p.aadhaar_number}</p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <CheckCircle2 className="text-indigo-500" size={20} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={fetchAadhaar}
                                    disabled={searchAadhaar.length !== 12 || isNaN(Number(searchAadhaar))}
                                    className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Link by UID Directly
                                </button>
                            </div>
                        )}

                        {step === 2 && aadhaarData && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Identity Preview</h2>
                                    <p className="text-slate-500 font-medium">Verify demographic details before proceeding to tax registration.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Legal Name</p>
                                        <p className="text-base font-bold text-slate-900">{aadhaarData.name}</p>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Electronic Mail</p>
                                        <p className="text-base font-bold text-slate-900">{aadhaarData.email || "NOT PROVIDED"}</p>
                                    </div>
                                    <div className="col-span-full bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registry UID Status</p>
                                            <p className="text-sm font-black text-emerald-600 tracking-widest uppercase">{aadhaarData.kyc_status}</p>
                                        </div>
                                        <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                                            <ShieldCheck size={20} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button onClick={() => setStep(1)} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-5 rounded-2xl transition-all">Cancel Bridge</button>
                                    <button onClick={sendOtp} className="flex-[2] bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all">Request Authorization OTP</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-10 text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Final Authorization</h2>
                                    <p className="text-slate-500 font-medium">Enter the 6-digit sequence to authorize PAN issuance for this UID.</p>
                                </div>
                                <input
                                    placeholder="0 0 0 0 0 0"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-[2rem] py-10 text-center text-5xl font-black tracking-[0.5em] text-indigo-900 focus:ring-0 focus:bg-white focus:shadow-inner transition-all placeholder:text-slate-100"
                                    maxLength={6}
                                />
                                {devOtp && (
                                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Dev Authorization Intercept</p>
                                        <p className="text-sm font-bold text-indigo-900">Bypassed Token: <span className="font-mono tracking-widest ml-2">{devOtp}</span></p>
                                    </div>
                                )}
                                <button onClick={verifyAndGenerate} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95">Authorise & Mint PAN</button>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="h-24 w-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center mx-auto text-white text-4xl shadow-2xl shadow-indigo-600/40">✓</div>
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tax Identity Minted</h2>
                                    <p className="text-slate-500 font-medium italic">Atomic Registry update successful. Permanent Account Number Issued.</p>
                                </div>

                                <div className="bg-indigo-950 p-12 rounded-[3rem] border border-white/5 relative overflow-hidden text-left shadow-2xl shadow-indigo-900/40">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <X size={150} className="text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4">PAN Permanent Account Number</p>
                                        <p className="text-5xl md:text-6xl font-black text-white tracking-[0.2em] font-mono leading-none">{generatedPan}</p>

                                        <div className="mt-12 flex gap-12 border-t border-white/10 pt-8">
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Authority</p>
                                                <p className="text-xs font-bold text-white mt-1 tracking-widest">ITD CENTRAL REGISTRY</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Verification</p>
                                                <p className="text-xs font-bold text-emerald-400 mt-1 tracking-widest">UID-LINKED-VERIFIED</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button onClick={downloadDocument} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3">
                                        <FileText size={18} /> Download E-PAN
                                    </button>
                                    <button onClick={() => { setStep(1); setSearchAadhaar(""); setAadhaarData(null); setOtp(""); }} className="flex-1 bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all">
                                        New Application
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
