"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
import { orderBy, where } from "firebase/firestore";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCollection, timestampToDate } from "@/lib/hooks";
import type { Material, WorkHour, Message, Project } from "@/lib/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { employeeName } = useEmployee();
  const demoDb = useDemoDb();

  const { data: firestoreProjects } = useCollection<Project>(
    "projects",
    [orderBy("name")],
    (id, data) => ({
      id,
      name: (data.name as string) || "",
      address: (data.address as string) || "",
      status: (data.status as Project["status"]) || "active",
    })
  );

  const project = DEMO_MODE
    ? demoDb.db.projects.find((p) => p.id === projectId)
    : firestoreProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
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

  const { data: firestoreMaterials, loading } = useCollection<Material>(
    "materials",
    [where("projectId", "==", projectId), orderBy("name")],
    (id, data) => ({
      id,
      projectId: (data.projectId as string) || "",
      name: (data.name as string) || "",
      quantity: (data.quantity as number) || 0,
      unit: (data.unit as string) || "Stück",
      minimum: (data.minimum as number) || 0,
    })
  );

  const materials = DEMO_MODE
    ? demoDb.db.materials.filter((m) => m.projectId === projectId)
    : firestoreMaterials;

  const handleAddMaterial = async () => {
    if (!newName.trim()) return;
    const item = {
      projectId,
      name: newName.trim(),
      unit: newUnit,
      quantity: 0,
      minimum: 0,
    };
    if (DEMO_MODE) {
      demoDb.addMaterial(item);
    } else {
      await addDoc(collection(db, "materials"), {
        ...item,
        createdAt: serverTimestamp(),
      });
    }
    setNewName("");
    setIsAdding(false);
  };

  const updateQty = async (material: Material, delta: number) => {
    const newQty = Math.max(0, material.quantity + delta);
    if (DEMO_MODE) {
      demoDb.updateMaterialQuantity(material.id, newQty);
    } else {
      await updateDoc(doc(db, "materials", material.id), {
        quantity: newQty,
        updatedAt: serverTimestamp(),
      });
    }
  };

  const setCustomQty = async (material: Material) => {
    const input = prompt(
      `Neue Menge für ${material.name} (${material.unit}):`,
      String(material.quantity)
    );
    if (input === null) return;
    const val = parseFloat(input.replace(",", "."));
    if (isNaN(val) || val < 0) return;
    if (DEMO_MODE) {
      demoDb.updateMaterialQuantity(material.id, val);
    } else {
      await updateDoc(doc(db, "materials", material.id), {
        quantity: val,
        updatedAt: serverTimestamp(),
      });
    }
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
              placeholder="Material Name (z.B. Zement)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[#16213E] rounded-xl px-4 py-3 text-white text-sm outline-none border border-slate-700"
                placeholder="Einheit (Stück, kg, m³)"
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

      {!DEMO_MODE && loading ? (
        <Spinner />
      ) : materials.length === 0 ? (
        <Empty text="Keine Materialien für diese Baustelle" />
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
                {m.minimum > 0 && (
                  <p className="text-slate-500 text-xs mb-3">
                    Minimum: {m.minimum} {m.unit}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateQty(m, -1)}
                    className="w-20 h-14 border border-slate-600 rounded-xl text-white flex flex-col items-center justify-center active:bg-[#16213E]"
                  >
                    <span className="text-xl font-bold">−</span>
                    <span className="text-xs">-1</span>
                  </button>
                  <button
                    onClick={() => updateQty(m, 1)}
                    className="w-20 h-14 bg-[#FF6B35] rounded-xl text-white flex flex-col items-center justify-center active:bg-[#e55a28]"
                  >
                    <span className="text-xl font-bold">+</span>
                    <span className="text-xs">+1</span>
                  </button>
                  <button
                    onClick={() => setCustomQty(m)}
                    className="flex-1 h-14 border border-slate-600 rounded-xl text-white text-sm active:bg-[#16213E]"
                  >
                    ✏ Menge ändern
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HoursSection({
  projectId,
  employeeName,
}: {
  projectId: string;
  employeeName: string;
}) {
  const demoDb = useDemoDb();
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("16:00");
  const [pause, setPause] = useState("30");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saved, setSaved] = useState(false);

  const { data: firestoreHours, loading } = useCollection<WorkHour>(
    "work_hours",
    [where("projectId", "==", projectId), orderBy("date", "desc")],
    (id, data) => ({
      id,
      projectId: (data.projectId as string) || "",
      employeeName: (data.employeeName as string) || "",
      hours: (data.hours as number) || 0,
      date: timestampToDate(data.date) || new Date(),
      startTime: data.startTime as string | undefined,
      endTime: data.endTime as string | undefined,
      pause: data.pause as number | undefined,
    })
  );

  const workHours = (DEMO_MODE
    ? demoDb.db.work_hours.filter((wh) => wh.projectId === projectId)
    : firestoreHours
  ).filter((wh) => wh.employeeName === employeeName);

  const calculateHours = () => {
    try {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      const pauseM = parseInt(pause) || 0;
      
      const diff = endTotal - startTotal - pauseM;
      if (diff < 0) return 0;
      return Math.round((diff / 60) * 100) / 100;
    } catch {
      return 0;
    }
  };

  const handleSave = async () => {
    const h = calculateHours();
    if (h <= 0 || h > 24) {
      alert("Bitte gültige Zeiten eingeben (Endzeit muss nach Startzeit liegen)");
      return;
    }
    const entry = {
      projectId,
      employeeName,
      hours: h,
      date: new Date(date),
      startTime,
      endTime,
      pause: parseInt(pause) || 0,
    };
    if (DEMO_MODE) {
      demoDb.addWorkHour(entry);
    } else {
      await addDoc(collection(db, "work_hours"), {
        ...entry,
        createdAt: serverTimestamp(),
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totalCalculated = calculateHours();

  return (
    <section className="border-t border-[#0F3460] mt-4">
      <SectionTitle>⏱ Arbeitszeiten</SectionTitle>

      <div className="px-4 pb-3">
        <div className="bg-[#0F3460] rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1">Datum</label>
              <input
                type="date"
                className="w-full bg-[#16213E] rounded-xl px-3 py-3 text-white outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1">Pause (Min)</label>
              <input
                type="number"
                className="w-full bg-[#16213E] rounded-xl px-3 py-3 text-white outline-none focus:ring-2 focus:ring-[#FF6B35] text-sm"
                value={pause}
                onChange={(e) => setPause(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1">Von</label>
              <input
                type="time"
                className="w-full bg-[#16213E] rounded-xl px-3 py-3 text-white outline-none focus:ring-2 focus:ring-[#FF6B35] text-lg"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1">Bis</label>
              <input
                type="time"
                className="w-full bg-[#16213E] rounded-xl px-3 py-3 text-white outline-none focus:ring-2 focus:ring-[#FF6B35] text-lg"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-[#16213E]/50 rounded-xl p-3 flex justify-between items-center">
            <span className="text-slate-400 text-xs">Gesamtstunden:</span>
            <span className="text-white font-bold text-xl">{totalCalculated}h</span>
          </div>

          <button
            onClick={handleSave}
            className={`w-full font-bold py-4 rounded-xl transition-all text-lg shadow-lg ${
              saved
                ? "bg-[#2ECC71] text-white"
                : "bg-gradient-to-r from-[#FF6B35] to-[#f78e1e] text-white active:scale-[0.98]"
            }`}
          >
            {saved ? "✓ Gespeichert" : "Arbeitszeit buchen"}
          </button>
        </div>
      </div>

      {!DEMO_MODE && loading ? (
        <Spinner />
      ) : workHours.length === 0 ? (
        <Empty text="Noch keine Einträge für diese Baustelle" />
      ) : (
        <div className="px-4 pb-4 space-y-2">
          {workHours.map((wh) => (
            <div key={wh.id} className="bg-[#16213E] rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">
                  {format(wh.date, "dd.MM.yyyy", { locale: de })}
                </p>
                {wh.startTime && (
                  <p className="text-slate-500 text-[10px] mt-1">
                    {wh.startTime} - {wh.endTime} ({wh.pause} min Pause)
                  </p>
                )}
              </div>
              <span className="text-[#FF6B35] font-bold text-lg">{wh.hours}h</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MessagesSection({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();

  const { data: firestoreMessages, loading } = useCollection<Message>(
    "messages",
    [orderBy("createdAt", "desc")],
    (id, data) => ({
      id,
      title: (data.title as string) || "",
      body: (data.body as string) || "",
      targetType: (data.targetType as Message["targetType"]) || "all",
      targetProjectIds: (data.targetProjectIds as string[]) || [],
      createdAt: timestampToDate(data.createdAt),
    })
  );

  const allMessages = DEMO_MODE ? demoDb.db.messages : firestoreMessages;
  const messages = allMessages.filter(
    (m) => m.targetType === "all" || m.targetProjectIds.includes(projectId)
  );

  if (messages.length === 0) return null;

  return (
    <section className="border-t border-[#0F3460] mt-4">
      <SectionTitle>💬 Nachrichten</SectionTitle>
      {!DEMO_MODE && loading ? (
        <Spinner />
      ) : (
        <div className="px-4 pb-4 space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-[#0F3460] rounded-xl p-4">
              <p className="text-white font-medium text-sm">{msg.title}</p>
              <p className="text-slate-400 text-xs mt-1">{msg.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function WarningsSection({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();

  const { data: firestoreMaterials } = useCollection<Material>(
    "materials",
    [where("projectId", "==", projectId)],
    (id, data) => ({
      id,
      projectId: (data.projectId as string) || "",
      name: (data.name as string) || "",
      quantity: (data.quantity as number) || 0,
      unit: (data.unit as string) || "Stück",
      minimum: (data.minimum as number) || 0,
    })
  );

  const materials = DEMO_MODE
    ? demoDb.db.materials.filter((m) => m.projectId === projectId)
    : firestoreMaterials;
  const lowMaterials = materials.filter((m) => m.quantity <= m.minimum);

  if (lowMaterials.length === 0) return null;

  return (
    <section className="border-t border-[#0F3460] mt-4 pb-6">
      <SectionTitle>⚠ Warnungen</SectionTitle>
      <div className="px-4 space-y-2">
        {lowMaterials.map((m) => (
          <div
            key={m.id}
            className="bg-[#E74C3C]/10 border border-[#E74C3C]/30 rounded-xl p-4"
          >
            <p className="text-[#E74C3C] font-medium text-sm">
              {m.name} fast leer
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Noch {m.quantity} {m.unit} (Min: {m.minimum})
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="text-slate-500 text-sm text-center py-6 px-4">{text}</p>
  );
}
