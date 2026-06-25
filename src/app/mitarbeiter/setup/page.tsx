"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HardHat, User, ArrowRight, Loader2 } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";

export default function SetupPage() {
  const { employeeName, setEmployeeName, isReady } = useEmployee();
  const demoDb = useDemoDb();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isReady && employeeName) {
      router.replace("/mitarbeiter/home");
    }
  }, [isReady, employeeName, router]);

  if (!isReady || (isReady && employeeName)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
         <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  const handleContinue = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    
    try {
      const normalizedName = name.trim();
      
      const existing = demoDb.db.users.find(
        u => u.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (!existing) {
        await demoDb.addUser({
          name: normalizedName,
          active: true,
          role: "employee"
        });
      }
      
      setEmployeeName(normalizedName);
      router.push("/mitarbeiter/home");
    } catch (e) {
      alert("Fehler bei der Anmeldung");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0B0E14] p-8">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-orange-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-orange-500/30 animate-in zoom-in duration-700">
            <HardHat className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-3">Login</h1>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Gib deinen Namen ein,<br />um auf deine Baustellen zuzugreifen.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Vollständiger Name</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                className="w-full bg-[#12161F] border border-white/5 rounded-3xl py-5 pl-14 pr-6 text-white text-lg placeholder-slate-700 outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-xl"
                placeholder="z.B. Max Mustermann"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                disabled={saving}
              />
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!name.trim() || saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-30 text-white font-black py-6 rounded-3xl transition-all text-xl shadow-2xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {saving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>WEITER <ArrowRight className="w-6 h-6" /></>
            )}
          </button>
        </div>
      </div>

      <div className="pt-10 text-center opacity-10 pointer-events-none">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">Construction Management V2.0</p>
      </div>
    </div>
  );
}
