"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, HardHat, FileText, Plus, Receipt, Camera, Upload, Trash2, Calendar, Clock as ClockIcon, AlertCircle } from "lucide-react";
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
      <div className="flex-1 flex items-center justify-center bg-[#0B0E14]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 bg-[#0B0E14]">
        <p>Baustelle nicht gefunden</p>
        <Link href="/mitarbeiter/home" className="text-[#FF6B35] mt-4 text-sm font-bold bg-[#FF6B35]/10 px-6 py-3 rounded-2xl">
          ZURÜCK ZUR ÜBERSICHT
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E14] overflow-hidden">
      {/* Premium Sticky Header */}
      <div className="px-5 pt-12 pb-4 bg-[#12161F]/80 backdrop-blur-md border-b border-white/5 flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/mitarbeiter/home"
            className="p-3 bg-white/5 text-slate-400 hover:text-white active:scale-90 transition-all rounded-2xl border border-white/5"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-xl truncate leading-tight">{project.name}</h1>
            {project.address && (
              <div className="flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider truncate">{project.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 space-y-6 scroll-smooth">
        <MaterialSection projectId={projectId} />
        <InvoiceSection projectId={projectId} employeeName={employeeName || "Unbekannt"} />
        <HoursSection
          projectId={projectId}
          employeeName={employeeName || "Unbekannt"}
        />
        <WarningsSection projectId={projectId} />
      </div>

      {/* Floating Action Hint für Mobile? (Optional) */}
    </div>
  );
}

function SectionHeader({ title, icon, action }: { title: string; icon: React.ReactNode, action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          {icon}
        </div>
        <h2 className="text-white font-bold text-lg">{title}</h2>
      </div>
      {action}
    </div>
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

  const setExactQty = async (m: Material, val: string) => {
    const num = parseInt(val);
    if (!isNaN(num)) {
      await demoDb.updateMaterialQuantity(m.id, Math.max(0, num));
    }
  };

  return (
    <section>
      <SectionHeader 
        title="Materialien" 
        icon={<Plus className="w-5 h-5 text-orange-500" />} 
        action={
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="text-orange-500 text-xs font-bold uppercase tracking-widest active:scale-95"
          >
            {isAdding ? "Abbrechen" : "+ NEU"}
          </button>
        }
      />

      {isAdding && (
        <div className="px-5 mb-6">
          <div className="bg-[#12161F] rounded-[24px] p-5 border border-orange-500/30 shadow-2xl">
            <div className="space-y-4">
              <input
                className="w-full bg-[#0B0E14] rounded-xl p-4 text-white text-md outline-none border border-white/10 placeholder:text-slate-600 focus:border-orange-500/50"
                placeholder="Bezeichnung (z.B. Sand)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div className="flex gap-3">
                <input
                  className="flex-1 bg-[#0B0E14] rounded-xl p-4 text-white text-md outline-none border border-white/10"
                  placeholder="Einheit (Stk/kg)"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                />
                <button
                  onClick={handleAddMaterial}
                  className="bg-orange-500 text-white px-8 rounded-xl font-bold active:scale-95 shadow-lg shadow-orange-500/20"
                >
                  HINZUFÜGEN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 space-y-4">
        {materials.length === 0 ? (
          <div className="bg-[#12161F] rounded-[24px] p-8 text-center border border-dashed border-white/5">
             <p className="text-slate-600 font-bold uppercase text-[10px] tracking-[0.2em]">Kein Material gelistet</p>
          </div>
        ) : (
          materials.map((m) => {
            const isLow = m.quantity <= m.minimum && m.minimum > 0;
            return (
              <div key={m.id} className={`bg-[#12161F] rounded-[32px] p-5 border ${isLow ? 'border-red-500/30' : 'border-white/5'} transition-all shadow-xl`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg leading-tight">{m.name}</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">{m.unit}</p>
                  </div>
                  {isLow && (
                    <div className="p-2 bg-red-500/10 rounded-full animate-pulse">
                       <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateQty(m, -1)} 
                    className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white active:bg-white/10 border border-white/5"
                  >
                    <span className="text-2xl">−</span>
                  </button>
                  
                  <div className="flex-1 relative">
                    <input 
                      type="number" 
                      className={`w-full bg-black/30 rounded-2xl h-14 text-center font-black text-2xl outline-none border transition-colors ${isLow ? 'text-red-400 border-red-500/20' : 'text-orange-500 border-white/10'}`}
                      value={m.quantity}
                      onChange={(e) => setExactQty(m, e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={() => updateQty(m, 1)} 
                    className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-orange-500/20"
                  >
                    <span className="text-2xl font-bold">+</span>
                  </button>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest">
                   <span>Min: {m.minimum || 0} {m.unit}</span>
                   <button onClick={() => {
                      const val = prompt(`Warnschwelle für ${m.name}:`, String(m.minimum || 0));
                      if (val) demoDb.updateMaterial(m.id, { minimum: parseInt(val) || 0 });
                   }} className="text-orange-500 opacity-60">⚓ SCHWELLE ANPASSEN</button>
                </div>
              </div>
            );
          })
        )}
      </div>
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

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const max = 1600; // Max Breite/Höhe
        if (width > height && width > max) { height *= max / width; width = max; }
        else if (height > max) { width *= max / height; height = max; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.7); // 70% Qualität
      };
    });
  };

  const handleSend = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    
    try {
      let imageUrl = "";
      if (image) {
        const compressedBlob = await compressImage(image);
        const formData = new FormData();
        formData.append('file', compressedBlob, 'image.jpg');
        formData.append('path', `inv_${Date.now()}.jpg`);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const resData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(resData.error || "Upload fehlgeschlagen");
        imageUrl = resData.url;
      }

      await demoDb.addMessage({
        title: `${employeeName}: ${title}`,
        body: amount ? `${amount} €` : "",
        targetType: "project",
        targetProjectIds: [projectId],
        metadata: { imageUrl }
      });

      setTitle(""); setAmount(""); setImage(null); setPreview(null); setSaved(true);
      setTimeout(() => { setSaved(false); setIsAdding(false); }, 2000);
    } catch (e: any) {
      alert("FEHLER: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <SectionHeader title="Rechnungen" icon={<Receipt className="w-5 h-5 text-orange-500" />} />
      <div className="px-5">
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-full bg-[#12161F] border border-white/5 rounded-[24px] p-6 flex flex-col items-center gap-3 active:bg-white/5 transition-all shadow-xl"
        >
          <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center">
             <Camera className="w-7 h-7 text-orange-500" />
          </div>
          <span className="text-white font-bold uppercase tracking-widest text-sm">NEUE RECHNUNG SENDEN</span>
        </button>

        {isAdding && (
          <div className="mt-4 bg-[#12161F] rounded-[32px] p-6 border border-orange-500/30 shadow-2xl space-y-6">
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">Wo wurde eingekauft?</label>
                  <input
                    className="w-full bg-[#0B0E14] rounded-2xl p-4 text-white outline-none border border-white/10"
                    placeholder="z.B. Hornbach, Tankstelle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
               </div>

               <div>
                 <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">Beleg fotografieren</label>
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-black/40 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative"
                 >
                    {preview ? (
                      <img src={preview} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-6">
                         <Upload className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                         <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Klicken zum Foto machen</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} capture="environment" accept="image/*" className="hidden" />
                 </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">Betrag (Optional)</label>
                  <input
                    className="w-full bg-[#0B0E14] rounded-2xl p-4 text-white outline-none border border-white/10"
                    placeholder="0.00 €"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
               </div>
            </div>

            <div className="flex gap-3">
               <button onClick={() => setIsAdding(false)} className="flex-1 py-5 rounded-2xl font-bold text-slate-500 bg-white/5 active:bg-white/10">ABBRECHEN</button>
               <button 
                  onClick={handleSend}
                  disabled={!title.trim() || saving}
                  className={`flex-[2] py-5 rounded-2xl font-bold text-white transition-all shadow-xl ${saved ? 'bg-green-500' : 'bg-orange-500 shadow-orange-500/20'} active:scale-95`}
               >
                 {saving ? "SENDET..." : saved ? "✓ GESENDET" : "JETZT SENDEN"}
               </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HoursSection({ projectId, employeeName }: { projectId: string; employeeName: string }) {
  const demoDb = useDemoDb();
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("16:00");
  const [pause, setPause] = useState("30");
  const [report, setReport] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
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
    setSaving(true);
    await demoDb.addWorkHour({
      projectId, employeeName, hours: h, date: new Date(date), startTime, endTime, pause: parseInt(pause) || 0, report
    });
    setSaved(true);
    setReport("");
    setTimeout(() => { setSaved(false); setSaving(false); }, 2000);
  };

  return (
    <section>
      <SectionHeader title="Zeiterfassung" icon={<ClockIcon className="w-5 h-5 text-orange-500" />} />
      <div className="px-5">
        <div className="bg-[#12161F] rounded-[32px] p-6 space-y-6 shadow-xl border border-white/5">
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">Datum</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-[#0B0E14] rounded-2xl p-4 text-white text-sm border border-white/10 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">Pause (Min)</label>
                <input type="number" value={pause} onChange={(e) => setPause(e.target.value)} className="w-full bg-[#0B0E14] rounded-2xl p-4 text-white text-sm border border-white/10 outline-none" />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">Start</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-[#0B0E14] rounded-2x p-4 text-white text-2xl font-black border border-white/10 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">Ende</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-[#0B0E14] rounded-2xl p-4 text-white text-2xl font-black border border-white/10 outline-none" />
              </div>
           </div>

           <div>
              <label className="text-[10px] font-black text-slate-500 mb-2 block uppercase tracking-widest">Woran wurde heute gearbeitet?</label>
              <textarea 
                rows={3}
                className="w-full bg-[#0B0E14] rounded-2xl p-4 text-white text-md border border-white/10 outline-none resize-none"
                placeholder="Bericht schreiben..."
                value={report}
                onChange={(e) => setReport(e.target.value)}
              />
           </div>

           <button 
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95 ${saved ? 'bg-green-500' : 'bg-orange-500 shadow-orange-500/20'}`}
           >
              {saving ? "BUCHT..." : saved ? "✓ BUCHUNG ERFOLGT" : `JETZT BUCHEN (${calculateHours()}h)`}
           </button>
        </div>

        {workHours.length > 0 && (
          <div className="mt-8 space-y-4">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Deine letzten Buchungen</p>
             {[...workHours].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3).map((wh) => (
                <div key={wh.id} className="bg-[#12161F]/50 rounded-[24px] p-5 border border-white/5 flex justify-between items-center">
                   <div>
                     <p className="text-white font-bold text-sm">{format(new Date(wh.date), "dd.MM.yyyy")}</p>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{wh.hours}h gearbeitet</p>
                   </div>
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                      <ClockIcon className="w-5 h-5 text-slate-500" />
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>
    </section>
  );
}

function WarningsSection({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();
  const lowMaterials = demoDb.db.materials.filter(m => m.projectId === projectId && m.quantity <= m.minimum && m.minimum > 0);

  if (lowMaterials.length === 0) return null;

  return (
    <div className="px-5 pb-10">
       <div className="bg-red-500/10 border border-red-500/20 rounded-[32px] p-6 flex items-start gap-4 shadow-xl">
          <div className="p-3 bg-red-500/20 rounded-2xl">
             <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h4 className="text-red-500 font-bold mb-2 uppercase tracking-widest text-xs">Achtung: Materialmangel!</h4>
            <div className="space-y-1">
               {lowMaterials.map(m => (
                 <p key={m.id} className="text-white text-sm font-bold">• {m.name} ({m.quantity} / {m.minimum} {m.unit})</p>
               ))}
            </div>
          </div>
       </div>
    </div>
  );
}
