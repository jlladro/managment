"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HardHat, User, ArrowRight, Loader2, XCircle } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";

export default function SetupPage() {
  const { employeeName, setEmployeeName, isReady } = useEmployee();
  const demoDb = useDemoDb();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
    setSaving(true);
    
    try {
      const normalizedName = name.trim();
      
      // Warte bis DB geladen ist
      if (!demoDb.ready) {
        setError("Verbindung wird aufgebaut, bitte kurz warten...");
        setSaving(false);
        return;
      }

      // Nur anmelden wenn der Name exakt (Groß/Klein egal) im System existiert
      const existing = demoDb.db.users.find(
        u => u.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (!existing) {
        setError("❌ Name nicht gefunden. Bitte wende dich an deinen Chef.");
        setSaving(false);
        return;
      }

      // Inaktive Mitarbeiter können sich nicht anmelden
      if (!existing.active) {
        setError("⛔ Dein Konto ist deaktiviert. Bitte wende dich an deinen Chef.");
        setSaving(false);
        return;
      }

      // Exakten Namen aus DB verwenden (damit Groß/Klein stimmt)
      setEmployeeName(existing.name);
      router.push("/mitarbeiter/home");
    } catch (e) {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
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

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Dein Name</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                className={`w-full bg-[#12161F] border rounded-3xl py-5 pl-14 pr-6 text-white text-lg placeholder-slate-700 outline-none transition-all shadow-xl ${
                  error 
                    ? 'border-red-500/50 focus:ring-4 focus:ring-red-500/10' 
                    : 'border-white/5 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10'
                }`}
                placeholder="z.B. Jon"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                autoFocus
                disabled={saving}
              />
            </div>
          </div>

          {/* Fehlermeldung */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 animate-in slide-in-from-top-2">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm font-medium leading-snug">{error}</p>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!name.trim() || saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-30 text-white font-black py-6 rounded-3xl transition-all text-xl shadow-2xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {saving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>ANMELDEN <ArrowRight className="w-6 h-6" /></>
            )}
          </button>
        </div>
      </div>

      <div className="pt-10 text-center opacity-10 pointer-events-none">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">HK Trocken- und Innenausbau</p>
      </div>
    </div>
  );
}
