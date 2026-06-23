"use client";

import { useRouter } from "next/navigation";
import { HardHat, Users, ShieldCheck } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/20">
            <HardHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Baustellen <span className="text-orange-500">System</span>
          </h1>
          <p className="text-slate-400">Willkommen! Bitte wählen Sie Ihren Bereich aus.</p>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => router.push("/mitarbeiter")}
            className="group flex items-center gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-orange-500/50 hover:bg-slate-800/50 transition-all text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-white font-bold">Mitarbeiter</div>
              <div className="text-xs text-slate-500">Stunden & Material erfassen</div>
            </div>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="group flex items-center gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-orange-500/50 hover:bg-slate-800/50 transition-all text-left active:scale-[0.98]"
          >
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-white font-bold">Chef Dashboard</div>
              <div className="text-xs text-slate-500">Verwaltung & Berichte</div>
            </div>
          </button>
        </div>

        <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">
          Version 2.0 • Cloud Sync
        </p>
      </div>
    </div>
  );
}
