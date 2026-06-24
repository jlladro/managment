"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";

export default function SetupPage() {
  const { setEmployeeName } = useEmployee();
  const demoDb = useDemoDb();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    
    try {
      const normalizedName = name.trim();
      
      // Prüfe ob Mitarbeiter schon in der DB existiert
      const existing = demoDb.db.users.find(
        u => u.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (!existing) {
        // Nur neu anlegen wenn noch nicht vorhanden
        await demoDb.addUser({
          name: normalizedName,
          active: true,
          role: "employee"
        });
      }
      
      // Lokal speichern
      setEmployeeName(normalizedName);
      router.push("/mitarbeiter/home");
    } catch (e) {
      alert("Fehler bei der Anmeldung");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#1A1A2E]">
      <div className="text-center mt-12 mb-10">
        <div className="w-24 h-24 bg-[#FF6B35]/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#FF6B35]/30">
          <HardHat className="w-12 h-12 text-[#FF6B35]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Mitarbeiter Login</h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Bitte gib deinen Vor- und Nachnamen ein,<br />um dich anzumelden.
        </p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Dein Name</label>
          <input
            className="w-full bg-[#16213E] border border-slate-700/50 rounded-2xl px-5 py-4 text-white text-lg placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-all"
            placeholder="z.B. Max Mustermann"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={saving}
          />
        </div>

        <button
          onClick={handleContinue}
          disabled={!name.trim() || saving}
          className="w-full bg-[#FF6B35] hover:bg-[#e55a28] disabled:opacity-40 text-white font-bold py-5 rounded-2xl transition-all text-xl shadow-lg shadow-orange-500/20 active:scale-95"
        >
          {saving ? "Lädt..." : "Jetzt Anmelden"}
        </button>
      </div>

      <p className="text-center text-slate-600 text-[10px] mt-10 uppercase tracking-widest">
        MANAGEMENT SYSTEM V2
      </p>
    </div>
  );
}
