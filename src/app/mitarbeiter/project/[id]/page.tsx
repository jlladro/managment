"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, HardHat, ChevronRight } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";
import type { Material, WorkHour, Message, Project } from "@/lib/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { employeeName } = useEmployee();
  const demoDb = useDemoDb();

  const project = demoDb.db.projects.find((p) => p.id === projectId);
  const loading = !demoDb.ready;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1A1A2E]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 bg-[#1A1A2E]">
        <p>Baustelle nicht gefunden</p>
        <Link href="/mitarbeiter/home" className="text-[#FF6B35] mt-4 text-sm">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1A1A2E] overflow-hidden">
      <div className="px-4 pt-10 pb-3 bg-[#1A1A2E] border-b border-[#0F3460] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/mitarbeiter/home"
            className="p-2 -ml-2 text-slate-400 hover:text-white active:bg-[#0F3460] rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg truncate">{project.name}</h1>
            {project.address && (
              <p className="text-slate-500 text-xs truncate">{project.address}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <MaterialSection projectId={projectId} />
        <HoursSection
          projectId={projectId}
          employeeName={employeeName || "Unbekannt"}
        />
        <MessagesSection projectId={projectId} />
        <WarningsSection projectId={projectId} />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white font-semibold text-base px-4 pt-5 pb-2 flex items-center gap-2">
      {children}
    </h2>
  );
}

function MaterialSection({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("Stück");

  const materials = demoDb.db.materials.filter((m) => m.projectId === projectId);

  const handleAddMaterial = async () => {
    if (!newName.trim()) return;
    await demoDb.addMaterial({
      projectId,
      name: newName.trim(),
      unit: newUnit,
      quantity: 0,
      minimum: 0,
    });
    setNewName("");
    setIsAdding(false);
  };

  const updateQty = async (material: Material, delta: number) => {
    const newQty = Math.max(0, material.quantity + delta);
    await demoDb.updateMaterialQuantity(material.id, newQty);
  };

  const setCustomQty = async (material: Material) => {
    const input = prompt(`Neue Menge für ${material.name} (${material.unit}):`, String(material.quantity));
    if (input === null) return;
    const val = parseFloat(input.replace(",", "."));
    if (isNaN(val) || val < 0) return;
    await demoDb.updateMaterialQuantity(material.id, val);
  };

  const setMinimum = async (material: Material) => {
    const input = prompt(`Mindestmenge für ${material.name} festlegen:`, String(material.minimum));
    if (input === null) return;
    const val = parseFloat(input.replace(",", "."));
    if (isNaN(val) || val < 0) return;
    await demoDb.updateMaterial(material.id, { minimum: val });
  };

  return (
    <section>
      <div className="flex items-center justify-between pr-4">
        <SectionTitle>📦 Material</SectionTitle>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="mt-4 bg-[#FF6B35]/10 text-[#FF6B35] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95"
        >
          {isAdding ? "Abbrechen" : "+ Hinzufügen"}
        </button>
      </div>

      {isAdding && (
        <div className="px-4 mb-4">
          <div className="bg-[#0F3460] rounded-2xl p-4 border border-[#FF6B35]/30 space-y-3">
            <input
              className="w-full bg-[#16213E] rounded-xl px-4 py-3 text-white text-sm outline-none border border-slate-700 focus:border-[#FF6B35]"
              placeholder="Material Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#16213E] rounded-xl px-4 py-3 text-white text-sm outline-none border border-slate-700"
                placeholder="Einheit"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
              />
              <button
                onClick={handleAddMaterial}
                className="bg-[#FF6B35] text-white px-6 rounded-xl font-bold active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {materials.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-6 px-4">Keine Materialien</p>
      ) : (
        <div className="px-4 pb-2 space-y-3">
          {materials.map((m) => {
            const isLow = m.quantity <= m.minimum;
            return (
              <div key={m.id} className="bg-[#0F3460] rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-white font-semibold text-lg">{m.name}</span>
                  {isLow && m.minimum > 0 && (
                    <span className="text-xs bg-[#E74C3C]/20 text-[#E74C3C] px-2 py-1 rounded-lg font-medium">
                      ⚠ Niedrig
                    </span>
                  )}
                </div>
                <p className={`text-3xl font-bold mb-3 ${isLow && m.minimum > 0 ? "text-[#E74C3C]" : "text-[#FF6B35]"}`}>
                  {m.quantity} {m.unit}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => updateQty(m, -1)} className="w-16 h-12 border border-slate-600 rounded-xl text-white font-bold">−1</button>
                  <button onClick={() => updateQty(m, 1)} className="w-16 h-12 bg-[#FF6B35] rounded-xl text-white font-bold">+1</button>
                  <button onClick={() => setCustomQty(m)} className="flex-1 h-12 border border-slate-600 rounded-xl text-white text-sm">Menge</button>
                  <button onClick={() => setMinimum(m)} className="w-12 h-12 border border-slate-600 rounded-xl text-white text-xs flex items-center justify-center" title="Warnschwelle">🔔</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HoursSection({ projectId, employeeName }: { projectId: string; employeeName: string; }) {
  const demoDb = useDemoDb();
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("16:00");
  const [pause, setPause] = useState("30");
  const [report, setReport] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saved, setSaved] = useState(false);

  const workHours = demoDb.db.work_hours.filter((wh) => wh.projectId === projectId && wh.employeeName === employeeName);

  const calculateHours = () => {
    try {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const diff = (endH * 60 + endM) - (startH * 60 + startM) - (parseInt(pause) || 0);
      return Math.max(0, Math.round((diff / 60) * 100) / 100);
    } catch { return 0; }
  };

  const handleSave = async () => {
    const h = calculateHours();
    await demoDb.addWorkHour({
      projectId, employeeName, hours: h, date: new Date(date), startTime, endTime, pause: parseInt(pause) || 0, report
    });
    setSaved(true);
    setReport("");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="border-t border-[#0F3460] mt-4">
      <SectionTitle>⏱ Arbeitszeiten</SectionTitle>
      <div className="px-4 pb-3">
        <div className="bg-[#0F3460] rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="w-full bg-[#16213E] rounded-xl p-3 text-white text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="number" className="w-full bg-[#16213E] rounded-xl p-3 text-white text-sm" value={pause} onChange={(e) => setPause(e.target.value)} placeholder="Pause" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="time" className="w-full bg-[#16213E] rounded-xl p-3 text-white text-lg" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <input type="time" className="w-full bg-[#16213E] rounded-xl p-3 text-white text-lg" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1">Tagesbericht</label>
            <textarea
              className="w-full bg-[#16213E] rounded-xl p-3 text-white text-sm outline-none border border-slate-700 resize-none"
              rows={3}
              placeholder="Was wurde heute gemacht?"
              value={report}
              onChange={(e) => setReport(e.target.value)}
            />
          </div>
          <button onClick={handleSave} className={`w-full font-bold py-4 rounded-xl text-white ${saved ? "bg-green-500" : "bg-[#FF6B35]"}`}>
            {saved ? "✓ Gespeichert" : `Buchen (${calculateHours()}h)`}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {workHours.length > 0 && <p className="text-slate-500 text-[10px] uppercase font-bold ml-1">Letzte Buchungen</p>}
          {[...workHours].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((wh) => (
            <div key={wh.id} className="bg-[#0F3460] rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-bold text-sm">
                    {format(new Date(wh.date), "dd.MM.yyyy")}
                  </p>
                  {wh.startTime && (
                    <p className="text-slate-500 text-[10px] mt-1">
                      {wh.startTime} - {wh.endTime} ({wh.pause} min Pause)
                    </p>
                  )}
                  {wh.report && (
                    <p className="text-slate-300 text-xs mt-2 italic bg-black/20 p-2 rounded-lg border-l-2 border-orange-500">
                      {wh.report}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-orange-400 font-bold text-lg">{wh.hours}h</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MessagesSection({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();
  const messages = demoDb.db.messages.filter(m => m.targetType === "all" || m.targetProjectIds.includes(projectId));

  if (messages.length === 0) return null;

  return (
    <section className="border-t border-[#0F3460] mt-4 px-4 pb-4">
      <SectionTitle>💬 Nachrichten</SectionTitle>
      <div className="space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-[#0F3460] rounded-xl p-4 border-l-4 border-orange-500">
            <p className="text-white font-medium text-sm">{msg.title}</p>
            <p className="text-slate-400 text-xs mt-1">{msg.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WarningsSection({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();
  const lowMaterials = demoDb.db.materials.filter(m => m.projectId === projectId && m.quantity <= m.minimum);

  if (lowMaterials.length === 0) return null;

  return (
    <section className="border-t border-[#0F3460] mt-4 px-4 pb-6">
      <SectionTitle>⚠ Warnungen</SectionTitle>
      <div className="space-y-2">
        {lowMaterials.map((m) => (
          <div key={m.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-500 font-medium text-sm">{m.name} fast leer</p>
            <p className="text-slate-500 text-xs mt-1">Noch {m.quantity} {m.unit}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
