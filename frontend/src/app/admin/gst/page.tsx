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

import { Building2, Users, MapPin, ShieldCheck, Send, CheckCircle2, Trash2, Plus, ArrowRight, FileText } from "lucide-react";

export default function GSTRegistration() {
    const [step, setStep] = useState(1);
    const [companyName, setCompanyName] = useState("");
    const [companyType, setCompanyType] = useState("SOLE_PROP");
    const [stateCode, setStateCode] = useState("27");
    const [address, setAddress] = useState("");
    const [aadhaarInput, setAadhaarInput] = useState("");
    const [owners, setOwners] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [otp, setOtp] = useState("");
    const [devOtp, setDevOtp] = useState("");
    const [generatedGst, setGeneratedGst] = useState("");

    const getHeaders = () => {
        const token = localStorage.getItem("admin_token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handleSearch = async (val: string) => {
        setAadhaarInput(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await axios.get(`${API_URL}/identity/search/aadhaar?query=${val}`, getHeaders());
            setSearchResults(res.data);
        } catch (err) {
            console.error("Owner search failed", err);
        } finally {
            setSearching(false);
        }
    };

    const selectOwner = (profile: any) => {
        if (owners.some(o => o.aadhaar_number === profile.aadhaar_number)) {
            toast.error("Owner already mapped to draft");
            return;
        }
        if (companyType === "SOLE_PROP" && owners.length >= 1) {
            toast.error("Proprietorship restricted to singular ownership");
            return;
        }
        if (profile.blacklist_flag) {
            toast.error("Registry Alert: Targeted UID is blacklisted");
            return;
        }
        setOwners([...owners, profile]);
        setAadhaarInput("");
        setSearchResults([]);
        toast.success("Identity Profile Linked to Application");
    };

    const addOwner = async () => {
        if (!aadhaarInput || aadhaarInput.length !== 12) return toast.error("Foundational ID must be exactly 12 digits");
        if (owners.some(o => o.aadhaar_number === aadhaarInput)) return toast.error("Owner already mapped to draft");
        if (companyType === "SOLE_PROP" && owners.length >= 1) return toast.error("Proprietorship restricted to singular ownership");

        try {
            const res = await axios.get(`${API_URL}/identity/aadhaar/${aadhaarInput}`, getHeaders());
            if (res.data.blacklist_flag) return toast.error("Registry Alert: Targeted UID is blacklisted");
            setOwners([...owners, res.data]);
            setAadhaarInput("");
            toast.success("Identity Profile Linked to Application");
        } catch (err: any) {
            toastError(err, "UID not found in primary registry");
        }
    };

    const removeOwner = (idx: number) => {
        setOwners(owners.filter((_, i) => i !== idx));
    };

    const proceedToOTP = async () => {
        if (!companyName || !address) return toast.error("Foundational entity data missing");
        if (owners.length === 0) return toast.error("Owner mapping required for business registry");

        try {
            const primaryOwner = owners[0];
            const res = await axios.post(`${API_URL}/identity/generate-otp`, {
                identity_value: primaryOwner.phone,
                identity_type: "PHONE"
            }, getHeaders());

            toast.success(`OTP routed to Primary Owner: ${primaryOwner.name}`);
            if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
            setStep(2);
        } catch (err: any) {
            toastError(err, "Mobile authentication routing failed");
        }
    };

    const verifyAndGenerateGST = async () => {
        try {
            await axios.post(`${API_URL}/identity/verify-otp`, {
                identity_value: owners[0].phone,
                identity_type: "PHONE",
                otp: otp
            }, getHeaders());

            const payload = {
                company_name: companyName,
                registered_address: address,
                state_code: stateCode,
                type: companyType,
                aadhaar_numbers: owners.map(o => o.aadhaar_number)
            };

            const res = await axios.post(`${API_URL}/business/register`, payload, getHeaders());
            toast.success(`Entity Minted in Business Mainframe`);
            setGeneratedGst(res.data.gst_number);
            setStep(3);
        } catch (err: any) {
            toastError(err, "Atomic registration failed");
        }
    };

    const downloadDocument = async () => {
        try {
            const res = await axios.get(`${API_URL}/documents/gst/${generatedGst}`, getHeaders());
            const newWindow = window.open();
            if (newWindow) {
                newWindow.document.write(res.data);
                newWindow.document.close();
            }
        } catch (err: any) {
            toastError(err, "Certificate synthesis failed");
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">GSTIN Issuance Authority</h1>
                <p className="text-sm text-slate-500 font-medium mt-2">Formalizing business entities within the tax and identity framework.</p>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Left: Entity Details */}
                    <div className="lg:col-span-3 bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-10 md:p-16 space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <Building2 className="text-purple-600" />
                                Entity Foundations
                            </h2>
                            <p className="text-slate-500 font-medium italic">Define the legal and geographic boundaries of the business.</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Entity / Company Name</label>
                                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Constitution</label>
                                    <select value={companyType} onChange={e => setCompanyType(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer">
                                        <option value="SOLE_PROP">Sole Proprietorship</option>
                                        <option value="PARTNERSHIP">Partnership</option>
                                        <option value="PVT_LTD">Private Limited</option>
                                        <option value="LTD">Public Limited</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registration State Code</label>
                                    <input value={stateCode} onChange={e => setStateCode(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all" maxLength={2} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Principal Place of Business</label>
                                <textarea rows={3} value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Owner Mapping */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-10 group">
                            <div className="space-y-4">
                                <h2 className="text-xl font-black flex items-center gap-3">
                                    <Users className="text-purple-400" />
                                    Owner Mapping
                                </h2>
                                <p className="text-slate-400 text-xs font-medium leading-relaxed italic">Link foundational Aadhaar UIDs to the business entity.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        placeholder="Search Owner or Add UID..."
                                        value={aadhaarInput}
                                        onChange={e => handleSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                    />
                                    <button onClick={addOwner} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-purple-500 text-slate-900 rounded-xl flex items-center justify-center hover:bg-purple-400 transition-all">
                                        <Plus size={20} />
                                    </button>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl p-2 max-h-[250px] overflow-y-auto custom-scrollbar-dark shadow-2xl">
                                            {searchResults.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => selectOwner(p)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-white/10 rounded-xl transition-all text-left"
                                                >
                                                    <div>
                                                        <p className="text-sm font-black text-white">{p.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest mt-1">UID: {p.aadhaar_number}</p>
                                                    </div>
                                                    <Plus className="text-purple-400" size={16} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {owners.length === 0 ? (
                                        <div className="text-center py-10 space-y-3 opacity-40">
                                            <Users size={32} className="mx-auto" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">No Owners Linked</p>
                                        </div>
                                    ) : (
                                        owners.map((owner, idx) => (
                                            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/card hover:border-purple-500/30 transition-all">
                                                <div className="flex gap-4 items-center">
                                                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white">{owner.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-500 font-mono tracking-widest mt-1">XXXX-{owner.aadhaar_number.slice(-4)}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeOwner(idx)} className="opacity-0 group-hover/card:opacity-100 p-2 text-slate-500 hover:text-red-400 transition-all">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button onClick={proceedToOTP} className="w-full bg-purple-500 text-slate-900 font-black py-5 rounded-2xl shadow-xl shadow-purple-500/10 hover:bg-purple-400 transition-all flex items-center justify-center gap-3 active:scale-95 group">
                                Next: Auth Handshake
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="bg-purple-50 rounded-[2rem] p-8 border border-purple-100 space-y-4">
                            <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                                <ShieldCheck size={20} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-900">Atomic Commitment</p>
                            <p className="text-xs text-purple-800/60 leading-relaxed font-medium">Business registration is an atomic operation. Data will be immutable once verified via primary owner OTP.</p>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="max-w-2xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-12 md:p-20 text-center space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Owner Verification</h2>
                            <p className="text-slate-500 font-medium">An encrypted token has been routed to</p>
                            <div className="inline-block px-10 py-5 bg-purple-50 rounded-full border border-purple-100">
                                <p className="text-2xl font-black text-purple-900 tracking-widest">{owners[0].name}</p>
                            </div>
                        </div>

                        <input
                            placeholder="0 0 0 0 0 0"
                            value={otp}
                            onChange={e => setOtp(e.target.value)}
                            className="w-full bg-slate-50 border-none rounded-[2rem] py-12 text-center text-6xl font-black tracking-[0.5em] text-slate-900 focus:ring-0 focus:bg-white focus:shadow-inner transition-all placeholder:text-slate-100"
                            maxLength={6}
                        />

                        {devOtp && (
                            <div className="bg-purple-50 border border-purple-100 p-6 rounded-[2rem]">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Dev Intercept</p>
                                <p className="text-lg font-black text-purple-900">Bypassed Token: <span className="font-mono tracking-widest ml-4">{devOtp}</span></p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <button onClick={verifyAndGenerateGST} className="w-full bg-purple-600 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-purple-600/20 hover:bg-purple-700 transition-all active:scale-95">Verify & Seal Entity</button>
                            <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">Back to Draft</button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="bg-white rounded-[3rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-12 md:p-20 text-center space-y-12">
                        <div className="h-28 w-28 rounded-[2.5rem] bg-purple-600 flex items-center justify-center mx-auto text-white text-5xl shadow-2xl shadow-purple-600/40 transform rotate-12">🏛</div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Entity Formalized</h2>
                            <p className="text-slate-500 font-medium italic">Business mapping and identity linkage successfully committed to mainframe.</p>
                        </div>

                        <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden text-left shadow-2xl shadow-slate-950/50">
                            <div className="absolute -top-10 -right-10 opacity-5">
                                <Building2 size={240} className="text-white" />
                            </div>
                            <div className="relative z-10 space-y-10">
                                <div>
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.5em] mb-4">GSTIN Goods & Services Tax Identification Number</p>
                                    <p className="text-5xl md:text-6xl font-black text-white tracking-[0.1em] font-mono leading-none">{generatedGst}</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/10 pt-10">
                                    <div>
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Legal Name</p>
                                        <p className="text-xs font-bold text-white uppercase">{companyName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Type</p>
                                        <p className="text-xs font-bold text-white uppercase">{companyType}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Region</p>
                                        <p className="text-xs font-bold text-white uppercase">STATE CODE {stateCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Compliance</p>
                                        <p className="text-xs font-bold text-emerald-400 uppercase">ACTIVE</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
                            <button onClick={downloadDocument} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-black py-6 rounded-[2rem] transition-all flex items-center justify-center gap-4 text-lg">
                                <FileText size={24} /> Download Certificate
                            </button>
                            <button onClick={() => { setStep(1); setOwners([]); setOtp(""); setCompanyName(""); setAddress(""); }} className="flex-1 bg-slate-900 text-white font-black py-6 rounded-[2rem] hover:bg-slate-800 transition-all text-lg shadow-xl shadow-slate-900/20">
                                Register New Entity
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
