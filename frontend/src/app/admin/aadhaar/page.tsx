"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FileText, Camera, ShieldCheck, Fingerprint, Send, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const toastError = (err: any, fallback: string) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return toast.error(detail);
    if (Array.isArray(detail)) return toast.error(detail[0]?.msg || fallback);
    if (typeof detail === "object" && detail !== null) return toast.error(JSON.stringify(detail));
    toast.error(fallback);
};

export default function AadhaarRegistry() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", photo_url: "https://via.placeholder.com/150" });
    const [otp, setOtp] = useState("");
    const [devOtp, setDevOtp] = useState("");
    const [generatedAadhaar, setGeneratedAadhaar] = useState("");

    const getHeaders = () => {
        const token = localStorage.getItem("admin_token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handlePhotoCapture = () => {
        toast.success("Biometric Scan & Photo Synchronization Complete");
        setStep(3);
    };

    const sendOtp = async () => {
        if (!form.phone || !form.name) return toast.error("Foundational identity data missing");
        try {
            const res = await axios.post(`${API_URL}/identity/generate-otp`, {
                identity_value: form.phone,
                identity_type: "PHONE"
            }, getHeaders());
            toast.success(`Encrypted OTP Dispatched`);
            if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
            setStep(4);
        } catch (err: any) {
            toastError(err, "OTP dispatch failed");
        }
    };

    const verifyAndGenerate = async () => {
        try {
            await axios.post(`${API_URL}/identity/verify-otp`, {
                identity_value: form.phone,
                identity_type: "PHONE",
                otp: otp
            }, getHeaders());

            // Prepare payload: convert empty strings to null for optional fields
            const payload = {
                ...form,
                email: form.email.trim() === "" ? null : form.email,
                address: form.address.trim() === "" ? null : form.address
            };

            const res = await axios.post(`${API_URL}/identity/aadhaar`, payload, getHeaders());
            toast.success(`Identity Seeded in Mainframe`);
            setGeneratedAadhaar(res.data.aadhaar_number);
            setStep(5);
        } catch (err: any) {
            toastError(err, "Verification or Seeding failed");
        }
    };

    const downloadDocument = async () => {
        try {
            const res = await axios.get(`${API_URL}/documents/aadhaar/${generatedAadhaar}`, getHeaders());
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
        { id: 1, label: "Identity Data", description: "Demographic input" },
        { id: 2, label: "Biometrics", description: "Ocular & Photo scan" },
        { id: 3, label: "OTP Request", description: "Registry verification" },
        { id: 4, label: "Authentication", description: "Final validation" },
        { id: 5, label: "Dispatch", description: "UIDAI Synthesis" }
    ];

    return (
        <div className="max-w-[1200px] mx-auto space-y-12 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aadhaar Authority Console</h1>
                <p className="text-sm text-slate-500 font-medium mt-2">Issuing unique identity credentials for the Digital India mainframe.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">

                {/* Step Indicators */}
                <div className="lg:col-span-1 space-y-8">
                    {steps.map((s) => (
                        <div key={s.id} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black transition-all ${step === s.id ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30' :
                                    step > s.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-300'
                                    }`}>
                                    {step > s.id ? '✓' : s.id}
                                </div>
                                {s.id !== 5 && (
                                    <div className={`w-0.5 h-12 my-2 rounded-full transition-colors ${step > s.id ? 'bg-emerald-200' : 'bg-slate-100'}`} />
                                )}
                            </div>
                            <div className="pt-1">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${step === s.id ? 'text-emerald-600' : 'text-slate-400'}`}>{s.label}</p>
                                <p className="text-xs text-slate-500 font-medium mt-1 opacity-60">{s.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Flow Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 p-10 md:p-16">

                        {step === 1 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Demographic Registration</h2>
                                    <p className="text-slate-500 font-medium">Input legal foundational data for identity issuance.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Access Number</label>
                                        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Universal Residence Address</label>
                                        <textarea rows={3} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none" />
                                    </div>
                                </div>
                                <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all active:scale-95">Initiate Biometric Scan</button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-10 text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Biometric Sync</h2>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto">Capturing high-resolution facial geometry for registry inclusion.</p>
                                </div>
                                <div className="h-64 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center space-y-4 group">
                                    <div className="h-20 w-20 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-[spin_3s_linear_infinite]" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Peripheral Access...</p>
                                </div>
                                <button onClick={handlePhotoCapture} className="w-full bg-emerald-500 text-slate-900 font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all">Capture & Encrypt</button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-10 text-center animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Security Handshake</h2>
                                    <p className="text-slate-500 font-medium">Authenticating identity against existing telecom registries.</p>
                                </div>
                                <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
                                    <p className="text-sm font-bold text-emerald-800">Dispatching validation token to</p>
                                    <p className="text-2xl font-black text-emerald-900 mt-2 tracking-widest">{form.phone}</p>
                                </div>
                                <button onClick={sendOtp} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-slate-800 transition-all">Dispatch OTP Token</button>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-10 text-center animate-in fade-in zoom-in-95 duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Auth Validation</h2>
                                    <p className="text-slate-500 font-medium">Enter the 6-digit cryptographic sequence.</p>
                                </div>
                                <input
                                    placeholder="0 0 0 0 0 0"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-2xl py-8 text-center text-4xl font-black tracking-[0.5em] text-slate-900 focus:ring-0 focus:bg-white focus:shadow-inner transition-all placeholder:text-slate-200"
                                    maxLength={6}
                                />
                                {devOtp && (
                                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Dev Environment Logic</p>
                                        <p className="text-sm font-bold text-emerald-900">Intercepted Token: <span className="font-mono tracking-widest ml-2">{devOtp}</span></p>
                                    </div>
                                )}
                                <button onClick={verifyAndGenerate} className="w-full bg-emerald-500 text-slate-900 font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all">Verify & Seal Identity</button>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="h-24 w-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center mx-auto text-white text-4xl shadow-2xl shadow-emerald-500/40">✓</div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Identity Issued</h2>
                                    <p className="text-slate-500 font-medium italic">Universal Identification Authority Registry Updated.</p>
                                </div>

                                <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden text-left shadow-2xl shadow-slate-900/40">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <FileText size={120} className="text-white" />
                                    </div>
                                    <div className="relative z-10 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Aadhaar Universal ID</p>
                                            <p className="text-4xl md:text-5xl font-black text-white mt-4 tracking-[0.15em] font-mono">
                                                {generatedAadhaar.match(/.{1,4}/g)?.join(' ')}
                                            </p>
                                        </div>
                                        <div className="flex gap-12">
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Status</p>
                                                <p className="text-xs font-bold text-white mt-1">ACTIVE</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Issued Date</p>
                                                <p className="text-xs font-bold text-white mt-1">{new Date().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button onClick={downloadDocument} className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3">
                                        <FileText size={18} /> Download Credential
                                    </button>
                                    <button onClick={() => { setStep(1); setForm({ name: "", phone: "", email: "", address: "", photo_url: "https://via.placeholder.com/150" }); setOtp(""); }} className="flex-1 bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all">
                                        New Registration
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
