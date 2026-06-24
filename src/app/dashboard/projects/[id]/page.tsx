"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Package, Users, Clock, AlertTriangle } from "lucide-react";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner } from "@/components/ui";
import type { Material, WorkHour, Project, Employee } from "@/lib/types";
import { PROJECT_STATUS_LABELS } from "@/lib/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const TABS = [
  { id: "material", label: "Material", icon: Package },
  { id: "employees", label: "Mitarbeiter", icon: Users },
  { id: "hours", label: "Arbeitszeiten", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ChefProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const demoDb = useDemoDb();
  const [activeTab, setActiveTab] = useState<TabId>("material");

  const projects = demoDb.db.projects || [];
  const project = projects.find((p) => p.id === projectId);
  const loading = !demoDb.ready;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Baustelle nicht gefunden</p>
        <Link href="/dashboard/projects" className="text-orange-400 mt-4 inline-block text-sm">Zurück zur Übersicht</Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-500/15 text-green-400",
    completed: "bg-slate-500/15 text-slate-400",
    paused: "bg-yellow-500/15 text-yellow-400",
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Alle Baustellen
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.address && <p className="text-slate-400 mt-1">{project.address}</p>}
          </div>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors[project.status]}`}>
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === id ? "text-orange-400 border-orange-500 bg-orange-500/5" : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "material" && <MaterialTab projectId={projectId} />}
      {activeTab === "employees" && <EmployeesTab projectId={projectId} />}
      {activeTab === "hours" && <HoursTab projectId={projectId} />}
    </div>
  );
}

function MaterialTab({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();
  const materials = demoDb.db.materials.filter((m) => m.projectId === projectId);

  if (materials.length === 0) return <div className="text-center py-20 text-slate-500">Kein Material gelistet</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {materials.map((m) => {
        const isLow = m.quantity <= m.minimum && m.minimum > 0;
        return (
          <div key={m.id} className={`bg-slate-800/40 rounded-2xl p-5 border ${isLow ? "border-red-500/40" : "border-slate-700/50"}`}>
            <h3 className="text-white font-medium mb-2">{m.name}</h3>
            <p className={`text-2xl font-bold ${isLow ? "text-red-400" : "text-orange-400"}`}>
              {m.quantity} <span className="text-sm font-normal text-slate-500">{m.unit}</span>
            </p>
            {m.minimum > 0 && <p className="text-xs text-slate-500 mt-1">Min: {m.minimum} {m.unit}</p>}
          </div>
        );
      })}
    </div>
  );
}

function EmployeesTab({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();
  const workHours = demoDb.db.work_hours.filter((wh) => wh.projectId === projectId);

  const stats = useMemo(() => {
    const map = new Map();
    workHours.forEach(wh => {
      const s = map.get(wh.employeeName) || { hours: 0, days: new Set() };
      s.hours += wh.hours;
      s.days.add(wh.date.toDateString());
      map.set(wh.employeeName, s);
    });
    return Array.from(map.entries()).sort((a,b) => b[1].hours - a[1].hours);
  }, [workHours]);

  if (stats.length === 0) return <div className="text-center py-20 text-slate-500">Noch keine Mitarbeiter-Einträge</div>;

  return (
    <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-slate-500 text-xs uppercase"><tr className="text-left">
          <th className="px-6 py-4">Mitarbeiter</th><th className="px-6 py-4">Tage</th><th className="px-6 py-4 text-right">Summe</th>
        </tr></thead>
        <tbody className="divide-y divide-white/5">
          {stats.map(([name, s]) => (
            <tr key={name} className="text-white">
              <td className="px-6 py-4 font-medium">{name}</td>
              <td className="px-6 py-4 text-slate-400">{s.days.size} Tage</td>
              <td className="px-6 py-4 text-right font-bold text-orange-400">{s.hours}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HoursTab({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();
  const workHours = [...demoDb.db.work_hours.filter((wh) => wh.projectId === projectId)].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (workHours.length === 0) return <div className="text-center py-20 text-slate-500">Noch keine Stunden gebucht</div>;

  return (
    <div className="bg-slate-800/20 border border-slate-700/50 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-slate-500 text-xs uppercase"><tr className="text-left">
          <th className="px-6 py-4">Datum</th><th className="px-6 py-4">Mitarbeiter</th><th className="px-6 py-4 text-right">Stunden</th>
        </tr></thead>
        <tbody className="divide-y divide-white/5">
          {workHours.map((wh) => (
            <tr key={wh.id} className="text-white">
              <td className="px-6 py-4 text-slate-400">{format(wh.date, "dd.MM.yyyy")}</td>
              <td className="px-6 py-4">{wh.employeeName}</td>
              <td className="px-6 py-4 text-right font-bold text-orange-400">{wh.hours}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
