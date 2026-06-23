"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
import { orderBy } from "firebase/firestore";
import { useCollection } from "@/lib/hooks";
import type { Employee } from "@/lib/types";

export default function SetupPage() {
  const { setEmployeeName } = useEmployee();
  const demoDb = useDemoDb();
  const router = useRouter();
  const [customName, setCustomName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);

  const { data: firestoreEmployees, loading } = useCollection<Employee>(
    "users",
    [orderBy("name")],
    (id, data) => ({
      id,
      name: (data.name as string) || "",
      active: (data.active as boolean) ?? true,
      role: (data.role as Employee["role"]) || "employee",
    })
  );

  const employees = DEMO_MODE
    ? demoDb.db.users.filter((e) => e.active)
    : firestoreEmployees.filter((e) => e.active);

  const handleContinue = () => {
    if (useCustom) {
      if (!customName.trim()) return;
      const normalizedName = customName.trim();
      
      // Check if employee already exists in DB
      const existing = employees.find(e => e.name.toLowerCase() === normalizedName.toLowerCase());
      if (!existing) {
        // Add new employee to DB
        demoDb.addUser({
          name: normalizedName,
          active: true,
          role: "employee"
        });
      }
      setEmployeeName(normalizedName);
    } else {
      const emp = employees.find((e) => e.id === selectedId);
      if (!emp) return;
      setEmployeeName(emp.name);
    }
    router.push("/mitarbeiter/home");
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="text-center mt-8 mb-8">
        <div className="w-20 h-20 bg-[#FF6B35]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HardHat className="w-10 h-10 text-[#FF6B35]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Willkommen!</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Wähle deinen Namen aus, um loszulegen.
        </p>
      </div>

      {!useCustom ? (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {!DEMO_MODE && loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]" />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              Keine Mitarbeiter vorhanden.
              <br />
              Gib deinen Namen manuell ein.
            </p>
          ) : (
            employees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelectedId(emp.id)}
                className={`w-full flex items-center gap-4 p-5 rounded-xl transition-colors text-left ${
                  selectedId === emp.id
                    ? "bg-[#FF6B35] text-white"
                    : "bg-[#0F3460] text-white hover:bg-[#16213E]"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedId === emp.id ? "bg-white/20" : "bg-[#FF6B35]/20"
                  }`}
                >
                  <span className="text-lg">👤</span>
                </div>
                <span className="text-lg font-semibold">{emp.name}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1">
          <input
            className="w-full bg-[#16213E] border-none rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            placeholder="z.B. Max Mustermann"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            autoFocus
          />
        </div>
      )}

      <div className="mt-4 space-y-3 pt-4">
        <button
          onClick={() => {
            setUseCustom(!useCustom);
            setSelectedId(null);
            setCustomName("");
          }}
          className="w-full text-[#FF6B35] text-sm py-2"
        >
          {useCustom ? "Aus Liste wählen" : "Name manuell eingeben"}
        </button>
        <button
          onClick={handleContinue}
          disabled={useCustom ? !customName.trim() : !selectedId}
          className="w-full bg-[#FF6B35] hover:bg-[#e55a28] disabled:opacity-40 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
