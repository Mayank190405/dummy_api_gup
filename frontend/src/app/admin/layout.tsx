"use client";

import { useState, ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("admin_token");
        if (!token) {
            router.push("/login");
        }
    }, [router, pathname]);

    const navLinks = [
        { name: "Dashboard", href: "/admin", icon: "📊" },
        { name: "Aadhaar Registry", href: "/admin/aadhaar", icon: "👤" },
        { name: "PAN Registry", href: "/admin/pan", icon: "💳" },
        { name: "GST Companies", href: "/admin/gst", icon: "🏢" },
        { name: "Invoices", href: "/admin/invoices", icon: "🧾" },
        { name: "Returns & Compliance", href: "/admin/returns", icon: "📈" },
        { name: "Developer API", href: "/admin/developer", icon: "🔑" },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const logout = () => {
        localStorage.removeItem("admin_token");
        window.location.href = "/login";
    };

    return (
        <div className="flex h-screen bg-[#F9FAFB] font-sans overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-72 bg-[#0F172A] border-r border-[#1E293B] flex flex-col hidden md:flex shrink-0">
                <div className="h-24 flex items-center px-8">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">G</div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-none tracking-tight">Gov.Identity</h1>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Registry Authority</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center justify-between px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                    }`}
                            >
                                <div className="flex items-center">
                                    <span className={`mr-4 text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{link.icon}</span>
                                    {link.name}
                                </div>
                                {isActive && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6">
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-3.5 text-sm font-semibold text-slate-500 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group border border-transparent hover:border-red-500/20"
                    >
                        <LogOut size={18} className="mr-3 transition-transform duration-200 group-hover:-translate-x-1" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" onClick={toggleMobileMenu}>
                    <div className="w-[280px] h-full bg-[#0F172A] flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="h-20 flex items-center justify-between px-6 border-b border-[#1E293B]">
                            <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-sm">G</div>
                                <h1 className="text-lg font-bold text-white tracking-tight">Gov.Identity</h1>
                            </div>
                            <button onClick={toggleMobileMenu} className="text-slate-400 hover:text-white p-2 bg-slate-800/50 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <nav className="flex-1 px-4 py-8 space-y-1.5">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={toggleMobileMenu}
                                        className={`flex items-center px-4 py-4 text-sm font-semibold rounded-xl transition-all duration-200 ${isActive
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : "text-slate-400 hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="mr-4 text-xl">{link.icon}</span>
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-6 border-t border-[#1E293B]">
                            <button onClick={logout} className="flex items-center w-full px-4 py-4 text-sm font-semibold text-slate-500 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
                                <LogOut size={18} className="mr-3" /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Header */}
                <header className="h-16 md:h-24 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 md:px-12 sticky top-0 z-40 shrink-0">
                    <div className="flex items-center space-x-4">
                        <button
                            className="md:hidden p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-200 shadow-sm active:scale-95"
                            onClick={toggleMobileMenu}
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden md:flex items-center">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mr-6">Authority Status</span>
                            <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">Registry_Active</span>
                            </div>
                        </div>
                        <div className="md:hidden flex items-center space-x-2">
                            <div className="h-7 w-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-500/20">G</div>
                            <span className="text-base font-black text-slate-900 tracking-tight">Gov.ID</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 md:space-x-8">
                        <div className="hidden lg:block text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-1.5">Official Session</p>
                            <p className="text-sm font-bold text-slate-900">Administrator_018</p>
                        </div>
                        <div className="group relative">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-sm md:text-base font-black text-slate-700 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 cursor-pointer overflow-hidden avatar-shimmer">
                                AD
                            </div>
                            <div className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white translate-x-1 -translate-y-1 shadow-sm" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-5 md:p-12 scroll-smooth custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
