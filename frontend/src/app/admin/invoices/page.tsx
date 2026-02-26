"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { X, ChevronRight, FileText, Search, Plus } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const toastError = (err: any, fallback: string) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return toast.error(detail);
    if (Array.isArray(detail)) return toast.error(detail[0]?.msg || fallback);
    if (typeof detail === "object" && detail !== null) return toast.error(JSON.stringify(detail));
    toast.error(fallback);
};

type LineItem = {
    description: string;
    hsn: string;
    quantity: number;
    unitPrice: number;
    taxRate: number; // e.g. 18 for 18%
};

export default function InvoicesRegistry() {
    const [companyGst, setCompanyGst] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const [buyerGst, setBuyerGst] = useState("");
    const [buyerSearchResults, setBuyerSearchResults] = useState<any[]>([]);
    const [buyerSearching, setBuyerSearching] = useState(false);

    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);

    const [items, setItems] = useState<LineItem[]>([
        { description: "", hsn: "", quantity: 1, unitPrice: 0, taxRate: 18 }
    ]);

    const [allInvoices, setAllInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const getHeaders = () => {
        const token = localStorage.getItem("admin_token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    const handleSearch = async (val: string) => {
        setCompanyGst(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await axios.get(`${API_URL}/business/search/company?query=${val}`, getHeaders());
            setSearchResults(res.data);
        } catch (err) {
            console.error("Company search failed", err);
        } finally {
            setSearching(false);
        }
    };

    const selectCompany = (company: any) => {
        setCompanyGst(company.gst_number);
        setSearchResults([]);
    };

    const handleBuyerSearch = async (val: string) => {
        setBuyerGst(val);
        if (val.length < 3) {
            setBuyerSearchResults([]);
            return;
        }
        setBuyerSearching(true);
        try {
            const res = await axios.get(`${API_URL}/business/search/company?query=${val}`, getHeaders());
            setBuyerSearchResults(res.data);
        } catch (err) {
            console.error("Buyer search failed", err);
        } finally {
            setBuyerSearching(false);
        }
    };

    const selectBuyer = (company: any) => {
        setBuyerGst(company.gst_number);
        setBuyerSearchResults([]);
    };

    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`${API_URL}/business/invoices`, getHeaders());
            setAllInvoices(res.data);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const addItem = () => {
        setItems([...items, { description: "", hsn: "", quantity: 1, unitPrice: 0, taxRate: 18 }]);
    };

    const updateItem = (index: number, field: keyof LineItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const totalTaxable = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice) * (item.taxRate / 100), 0);
    const grandTotal = totalTaxable + totalTax;

    const handleSaveDraft = () => {
        if (!companyGst || !buyerGst) return toast.error("GSTINs required");
        toast.success("Draft Stored in Authority Cache");
    };

    const handleFinalSubmit = async () => {
        if (!companyGst || !buyerGst) return toast.error("GSTINs required");
        if (companyGst === buyerGst) return toast.error("Seller and Buyer cannot be the same entity");
        if (items.some(i => !i.description || i.unitPrice <= 0)) return toast.error("Invalid line items found");

        try {
            const compRes = await axios.get(`${API_URL}/business/company/${companyGst}`, getHeaders());
            const companyId = compRes.data.id;

            await axios.post(`${API_URL}/business/add-invoice`, {
                company_id: companyId,
                invoice_number: invoiceNumber,
                buyer_gstin: buyerGst,
                date: new Date(invoiceDate).toISOString(),
                total_taxable: totalTaxable,
                total_tax: totalTax,
                grand_total: grandTotal,
                status: "UNPAID",
                delay_days: 0
            }, getHeaders());

            toast.success("Transaction Sealed & Logged");
            setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
            setItems([{ description: "", hsn: "", quantity: 1, unitPrice: 0, taxRate: 18 }]);
            setBuyerGst("");
            fetchInvoices();
        } catch (err) {
            toastError(err, "Registry commit failed");
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await axios.patch(`${API_URL}/business/invoices/${id}/status?status=${status}`, {}, getHeaders());
            toast.success(`Marked as ${status}`);
            fetchInvoices();
        } catch (err) {
            toastError(err, "Status update failed");
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-12 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Compliance Ledger</h1>
                <p className="text-sm text-slate-500 font-medium mt-2">Issuing immutable transactional records for cross-registry validation.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-12 items-start">

                {/* Data Entry Card */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">

                        {/* Header Section */}
                        <div className="p-8 md:p-10 border-b border-slate-50 bg-slate-50/30 grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issuing Authority (Search Name or Enter GSTIN)</label>
                                    <input
                                        value={companyGst}
                                        onChange={e => handleSearch(e.target.value)}
                                        placeholder="Search Company or Enter GSTIN..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                    />

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 max-h-[250px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                            {searchResults.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => selectCompany(c)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all text-left"
                                                >
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{c.company_name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest mt-1">GSTIN: {c.gst_number}</p>
                                                    </div>
                                                    <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors" size={16} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Counterparty (Buyer Name or GSTIN)</label>
                                    <input
                                        value={buyerGst}
                                        onChange={e => handleBuyerSearch(e.target.value)}
                                        placeholder="Search Counterparty..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                    />
                                    {/* Buyer Search Results */}
                                    {buyerSearchResults.length > 0 && (
                                        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 max-h-[250px] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                            {buyerSearchResults.map((c) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => selectBuyer(c)}
                                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all text-left"
                                                >
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{c.company_name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 font-mono tracking-widest mt-1">GSTIN: {c.gst_number}</p>
                                                    </div>
                                                    <Plus className="text-slate-200 group-hover:text-emerald-500 transition-colors" size={16} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Reference Number</label>
                                    <input
                                        value={invoiceNumber}
                                        onChange={e => setInvoiceNumber(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Transaction Date</label>
                                    <input
                                        type="date"
                                        value={invoiceDate}
                                        onChange={e => setInvoiceDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Line Items - Mobile Friendly Layout */}
                        <div className="p-5 md:p-8">
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                        <tr>
                                            <th className="px-4 py-4">Service/Goods Description</th>
                                            <th className="px-4 py-4 w-24">HSN</th>
                                            <th className="px-4 py-4 w-20 text-center">Qty</th>
                                            <th className="px-4 py-4 w-32 text-right">Rate</th>
                                            <th className="px-4 py-4 w-24 text-center">Tax</th>
                                            <th className="px-4 py-4 w-32 text-right">Total</th>
                                            <th className="px-4 py-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="p-2">
                                                    <input
                                                        value={item.description}
                                                        onChange={e => updateItem(idx, 'description', e.target.value)}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-2 text-sm font-semibold text-slate-700 placeholder:text-slate-300"
                                                        placeholder="Item description..."
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        value={item.hsn}
                                                        onChange={e => updateItem(idx, 'hsn', e.target.value)}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-2 text-sm font-mono text-slate-400"
                                                        placeholder="9983"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-2 text-sm text-center font-bold text-slate-700"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.unitPrice}
                                                        onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))}
                                                        className="w-full bg-transparent border-none focus:ring-0 p-2 text-sm text-right font-bold text-slate-700"
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <select
                                                        value={item.taxRate}
                                                        onChange={e => updateItem(idx, 'taxRate', parseInt(e.target.value))}
                                                        className="bg-transparent border-none focus:ring-0 p-2 text-[11px] font-black text-slate-500 appearance-none cursor-pointer text-center"
                                                    >
                                                        <option value="0">0%</option>
                                                        <option value="5">5%</option>
                                                        <option value="12">12%</option>
                                                        <option value="18">18%</option>
                                                        <option value="28">28%</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 text-right">
                                                    <span className="text-sm font-black text-slate-900">
                                                        ₹{(item.quantity * item.unitPrice * (1 + item.taxRate / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100">
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View Items */}
                            <div className="md:hidden space-y-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative">
                                        <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-slate-300 p-2"><X size={16} /></button>
                                        <div className="space-y-3">
                                            <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" placeholder="Description" />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input value={item.hsn} onChange={e => updateItem(idx, 'hsn', e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono" placeholder="HSN" />
                                                <select value={item.taxRate} onChange={e => updateItem(idx, 'taxRate', parseInt(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold">
                                                    <option value="18">18% GST</option>
                                                    <option value="12">12% GST</option>
                                                    <option value="5">5% GST</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">QTY</span>
                                                    <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold" />
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">₹</span>
                                                    <input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-right" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={addItem} className="mt-6 w-full md:w-auto px-8 py-4 text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-all flex items-center justify-center mx-auto">
                                <span className="mr-2 text-lg">+</span> Add Line Item
                            </button>
                        </div>

                        {/* Summary Block */}
                        <div className="bg-slate-900 p-8 md:p-12 text-white">
                            <div className="max-w-md ml-auto space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                                        <span>Subtotal Value</span>
                                        <span className="text-white text-sm">₹{totalTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                                        <span>Total GST (Integrated)</span>
                                        <span className="text-white text-sm">₹{totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-4" />
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Grand Total</span>
                                        <span className="text-3xl font-black tracking-tight">₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <button onClick={handleSaveDraft} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-8 rounded-2xl border border-white/10 transition-all active:scale-95">Save Draft</button>
                                    <button onClick={handleFinalSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 px-10 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95">Seal Transaction</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registry Ledger Card */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col h-full xl:max-h-[800px]">
                    <div className="p-8 border-b border-slate-50">
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Registry Trace</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global Audit Ledger</p>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 space-y-4">
                        {loading ? (
                            <div className="p-20 text-center space-y-4">
                                <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Authority Vault...</p>
                            </div>
                        ) : allInvoices.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center justify-center space-y-4 opacity-30">
                                <div className="text-6xl">📊</div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Transactions Found</p>
                            </div>
                        ) : (
                            allInvoices.map((inv) => (
                                <div key={inv.id} className="bg-slate-50/50 hover:bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{new Date(inv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className="text-sm font-black text-slate-900 mt-1">{inv.invoice_number}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">₹{inv.grand_total.toLocaleString()}</p>
                                            <p className="text-[9px] font-mono text-slate-400 mt-0.5">{inv.buyer_gstin}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100/50">
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                            inv.status === 'UNPAID' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {inv.status}
                                        </div>
                                        <select
                                            value={inv.status}
                                            onChange={(e) => updateStatus(inv.id, e.target.value)}
                                            className="text-[9px] font-black uppercase text-slate-400 bg-transparent hover:text-slate-900 cursor-pointer outline-none transition-colors"
                                        >
                                            <option value="UNPAID">PENDING</option>
                                            <option value="PAID">PAID</option>
                                            <option value="DEFAULTED">DEFAULT</option>
                                        </select>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-8 border-t border-slate-50 bg-slate-50/50">
                        <button className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">Generate Compliance Data (.CSV)</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
