"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, HardHat, ChevronRight, FileText, Plus, Receipt, Camera, Upload, X } from "lucide-react";
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

      <div className="flex-1 overflow-y-auto pb-20">
        <MaterialSection projectId={projectId} />
        <InvoiceSection projectId={projectId} employeeName={employeeName || "Unbekannt"} />
        <HoursSection
          projectId={projectId}
          employeeName={employeeName || "Unbekannt"}
        />
        <WarningsSection projectId={projectId} />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white font-semibold text-base px-4 pt-6 pb-2 flex items-center gap-2">
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

  const updateQty = async (m: Material, delta: number) => {
    await demoDb.updateMaterialQuantity(m.id, Math.max(0, m.quantity + delta));
  };

  const setCustomQty = async (m: Material) => {
    const val = prompt(`Neue Menge für ${m.name}:`, String(m.quantity));
    if (val !== null) {
      await demoDb.updateMaterialQuantity(m.id, Math.max(0, parseInt(val) || 0));
    }
  };

  const setMinimum = async (m: Material) => {
    const val = prompt(`Warnschwelle für ${m.name} festlegen:`, String(m.minimum || 0));
    if (val !== null) {
      await demoDb.updateMaterial(m.id, { minimum: Math.max(0, parseInt(val) || 0) });
    }
  };

  return (
    <section>
      <div className="flex justify-between items-end pr-4">
        <SectionTitle>📦 Materialien</SectionTitle>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[#FF6B35] bg-[#FF6B35]/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 mb-1.5 active:scale-95"
        >
          <Plus className="w-3 h-3" /> Material
        </button>
      </div>

      {isAdding && (
        <div className="px-4 pb-4">
          <div className="bg-[#0F3460] rounded-2xl p-4 border border-[#FF6B35]/20">
            <div className="flex gap-3 mb-3">
              <input
                className="flex-1 bg-[#16213E] rounded-xl p-3 text-white text-sm outline-none border border-slate-700"
                placeholder="Name (z.B. Zement)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <input
                className="w-24 bg-[#16213E] rounded-xl p-3 text-white text-sm outline-none border border-slate-700"
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
            const isLow = m.quantity <= m.minimum && m.minimum > 0;
            return (
              <div key={m.id} className="bg-[#0F3460] rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-white font-semibold text-lg">{m.name}</span>
                  {isLow && (
                    <span className="text-xs bg-[#E74C3C]/20 text-[#E74C3C] px-2 py-1 rounded-lg font-medium">
                      ⚠ Niedrig
                    </span>
                  )}
                </div>
                <p className={`text-3xl font-bold mb-3 ${isLow ? "text-[#E74C3C]" : "text-[#FF6B35]"}`}>
                  {m.quantity} {m.unit}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => updateQty(m, -1)} className="w-16 h-12 border border-slate-600 rounded-xl text-white font-bold active:bg-white/5">−1</button>
                  <button onClick={() => updateQty(m, 1)} className="w-16 h-12 bg-[#FF6B35] rounded-xl text-white font-bold active:scale-95">+1</button>
                  <button onClick={() => setCustomQty(m)} className="flex-1 h-12 border border-slate-600 rounded-xl text-white text-sm active:bg-white/5">Menge</button>
                  <button onClick={() => setMinimum(m)} className="w-12 h-12 border border-slate-600 rounded-xl text-white text-xs flex items-center justify-center active:bg-white/5" title="Warnschwelle">🔔</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function InvoiceSection({ projectId, employeeName }: { projectId: string; employeeName: string }) {
  const demoDb = useDemoDb();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    
    try {
      let imageUrl = "";
      
      if (image) {
        // Upload image to Supabase
        const formData = new FormData();
        formData.append('file', image);
        formData.append('path', `inv_${Date.now()}_${image.name.replace(/\s/g, '_')}`);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error("Bild-Upload fehlgeschlagen. Hast du den Bucket 'invoices' erstellt?");
        const { url } = await uploadRes.json();
        imageUrl = url;
      }

      await demoDb.addMessage({
        title: `${employeeName}: ${title}`,
        body: amount ? `${amount} €` : "",
        targetType: "project",
        targetProjectIds: [projectId],
        metadata: { imageUrl } // Wir speichern die Bild-URL in metadata
      });

      setTitle("");
      setAmount("");
      setImage(null);
      setPreview(null);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setIsAdding(false);
      }, 2000);
    } catch (e: any) {
      alert("Fehler: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="px-4">
      <div className="flex justify-between items-end">
        <SectionTitle>🧾 Rechnungen</SectionTitle>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-[#FF6B35] bg-[#FF6B35]/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 mb-1.5 active:scale-95"
        >
          <Receipt className="w-4 h-4" /> Rechnung senden
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#0F3460] rounded-2xl p-5 space-y-4 border border-[#FF6B35]/20 mt-2 shadow-2xl">
          <div className="space-y-4">
             <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Gekauft bei / Was wurde gekauft?</label>
                <input
                    className="w-full bg-[#16213E] rounded-xl p-3 text-white text-sm outline-none border border-slate-700"
                    placeholder="z.B. Hornbach, Tankstelle..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
             </div>
             
             <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Beleg abfotografieren</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-video bg-[#16213E] rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden relative group"
                >
                  {preview ? (
                    <>
                      <img src={preview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                       <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-[#FF6B35]" />
                       </div>
                       <p className="text-xs text-slate-500 font-bold">Foto machen oder hochladen</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Betrag (Optional)</label>
                <input
                    type="text"
                    className="w-full bg-[#16213E] rounded-xl p-3 text-white text-sm outline-none border border-slate-700"
                    placeholder="€"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
             </div>
          </div>
          <button 
            onClick={handleSend}
            disabled={!title.trim() || saving || saved}
            className={`w-full py-5 rounded-2xl font-bold transition-all ${saved ? "bg-green-500" : "bg-[#FF6B35]"} text-white active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10`}
          >
            {saving ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sende...</>
            ) : saved ? (
              "✓ Erfolgreich gesendet"
            ) : (
              <><Upload className="w-5 h-5" /> Rechnung abschicken</>
            )}
          </button>
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
        <div className="bg-[#0F3460] rounded-2xl p-4 space-y-4 shadow-lg border border-white/5">
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className="w-full bg-[#16213E] rounded-xl p-3 text-white text-sm border border-slate-700 outline-none" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="number" className="w-full bg-[#16213E] rounded-xl p-3 text-white text-sm border border-slate-700 outline-none" value={pause} onChange={(e) => setPause(e.target.value)} placeholder="Pause" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="time" className="w-full bg-[#16213E] rounded-xl p-3 text-white text-lg border border-slate-700 outline-none" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <input type="time" className="w-full bg-[#16213E] rounded-xl p-3 text-white text-lg border border-slate-700 outline-none" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1 tracking-widest">Tagesbericht</label>
            <textarea
              className="w-full bg-[#16213E] rounded-xl p-3 text-white text-sm outline-none border border-slate-700 resize-none focus:border-[#FF6B35]/50 transition-colors"
              rows={3}
              placeholder="Was wurde heute gemacht?"
              value={report}
              onChange={(e) => setReport(e.target.value)}
            />
          </div>
          <button onClick={handleSave} className={`w-full font-bold py-4 rounded-xl text-white transition-all shadow-lg active:scale-95 ${saved ? "bg-green-500" : "bg-[#FF6B35]"}`}>
            {saved ? "✓ Gespeichert" : `Buchen (${calculateHours()}h)`}
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {workHours.length > 0 && <p className="text-slate-500 text-[10px] uppercase font-bold ml-1 tracking-widest">Letzte Buchungen</p>}
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

function WarningsSection({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();
  const lowMaterials = demoDb.db.materials.filter(m => m.projectId === projectId && m.quantity <= m.minimum && m.minimum > 0);

  if (lowMaterials.length === 0) return null;

  return (
    <section className="px-4 mt-6">
       <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
          <SectionTitle><span className="text-red-400">🚨 Material dringend!</span></SectionTitle>
          <div className="space-y-2 mt-2">
             {lowMaterials.map(m => (
               <div key={m.id} className="flex justify-between items-center text-sm">
                  <span className="text-white font-medium">{m.name}</span>
                  <span className="text-red-400 font-bold">{m.quantity} / {m.minimum} {m.unit}</span>
               </div>
             ))}
          </div>
       </div>
    </section>
  );
}
