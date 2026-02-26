import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-3xl">
          <ShieldCheck className="mx-auto h-20 w-20 text-emerald-600 mb-6" />
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Simulated Government & Credit Authority
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            A comprehensive simulation platform for verifying Aadhaar, PAN, GST Compliance, and assessing financial credit risk.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/portal"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
            >
              Access Verification Portal
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-slate-200 text-lg font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <Building2 className="mr-2 h-5 w-5" />
              Manage Entities (Admin)
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
