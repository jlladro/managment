"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Package, Users, Clock, AlertTriangle } from "lucide-react";
import { orderBy, where } from "firebase/firestore";
import { useCollection, timestampToDate } from "@/lib/hooks";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
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

  const { data: firestoreProjects, loading } = useCollection<Project>(
    "projects",
    [orderBy("name")],
    (id, data) => ({
      id,
      name: (data.name as string) || "",
      address: (data.address as string) || "",
      status: (data.status as Project["status"]) || "active",
      description: data.description as string | undefined,
    })
  );

  const projects = DEMO_MODE ? demoDb.db.projects : firestoreProjects;
  const project = projects.find((p) => p.id === projectId);

  if (!DEMO_MODE && loading) return <LoadingSpinner />;

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Baustelle nicht gefunden</p>
        <Link href="/dashboard/projects" className="text-orange-400 mt-4 inline-block text-sm">
          Zurück zur Übersicht
        </Link>
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
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle Baustellen
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.address && (
              <p className="text-slate-400 mt-1">{project.address}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors[project.status]}`}>
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-700 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors ${
              activeTab === id
                ? "bg-orange-500/15 text-orange-400 border-b-2 border-orange-500"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
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

  if (!DEMO_MODE && loading) return <LoadingSpinner />;

  if (materials.length === 0) {
    return (
      <div className="table-container p-12 text-center text-slate-400">
        Keine Materialien für diese Baustelle
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {materials.map((m) => {
        const isLow = m.quantity <= m.minimum;
        return (
          <div
            key={m.id}
            className={`bg-slate-800 rounded-2xl p-5 border ${
              isLow ? "border-red-500/40" : "border-slate-700"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-white font-semibold text-lg">{m.name}</h3>
              {isLow && (
                <span className="flex items-center gap-1 text-xs bg-red-500/15 text-red-400 px-2 py-1 rounded-lg">
                  <AlertTriangle className="w-3 h-3" />
                  Niedrig
                </span>
              )}
            </div>
            <p className={`text-3xl font-bold ${isLow ? "text-red-400" : "text-orange-400"}`}>
              {m.quantity} <span className="text-lg font-normal text-slate-400">{m.unit}</span>
            </p>
            <p className="text-slate-500 text-sm mt-2">Minimum: {m.minimum} {m.unit}</p>
          </div>
        );
      })}
    </div>
  );
}

function EmployeesTab({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();

  const { data: firestoreHours, loading: loadingHours } = useCollection<WorkHour>(
    "work_hours",
    [where("projectId", "==", projectId)],
    (id, data) => ({
      id,
      projectId: (data.projectId as string) || "",
      employeeName: (data.employeeName as string) || "",
      hours: (data.hours as number) || 0,
      date: timestampToDate(data.date) || new Date(),
    })
  );

  const { data: firestoreUsers, loading: loadingUsers } = useCollection<Employee>(
    "users",
    [orderBy("name")],
    (id, data) => ({
      id,
      name: (data.name as string) || "",
      active: (data.active as boolean) ?? true,
      role: (data.role as Employee["role"]) || "employee",
    })
  );

  const workHours = DEMO_MODE
    ? demoDb.db.work_hours.filter((wh) => wh.projectId === projectId)
    : firestoreHours;
  const allUsers = DEMO_MODE ? demoDb.db.users : firestoreUsers;
  const loading = DEMO_MODE ? false : loadingHours || loadingUsers;

  const employeeStats = useMemo(() => {
    const map = new Map<string, { totalHours: number; entries: number; lastDate: Date | null }>();
    for (const wh of workHours) {
      const existing = map.get(wh.employeeName) || {
        totalHours: 0,
        entries: 0,
        lastDate: null,
      };
      existing.totalHours += wh.hours;
      existing.entries += 1;
      if (!existing.lastDate || wh.date > existing.lastDate) {
        existing.lastDate = wh.date;
      }
      map.set(wh.employeeName, existing);
    }
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [workHours]);

  const activeWithoutHours = allUsers
    .filter((u) => u.active && !employeeStats.some((e) => e.name === u.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {employeeStats.length > 0 ? (
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3">Mitarbeiter</th>
                <th className="text-left px-6 py-3">Einträge</th>
                <th className="text-left px-6 py-3">Letzter Tag</th>
                <th className="text-right px-6 py-3">Gesamtstunden</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.map((emp) => (
                <tr key={emp.name} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold text-sm">
                        {emp.name[0]?.toUpperCase()}
                      </div>
                      <span className="text-white font-medium">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{emp.entries}</td>
                  <td className="px-6 py-4 text-slate-400">
                    {emp.lastDate
                      ? format(emp.lastDate, "dd.MM.yyyy", { locale: de })
                      : "–"}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-orange-400">
                    {emp.totalHours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container p-8 text-center text-slate-400">
          Noch keine Mitarbeiter mit Stunden auf dieser Baustelle
        </div>
      )}

      {activeWithoutHours.length > 0 && (
        <div>
          <h3 className="text-slate-400 text-sm font-medium mb-3">
            Aktive Mitarbeiter ohne Einträge auf dieser Baustelle
          </h3>
          <div className="flex flex-wrap gap-2">
            {activeWithoutHours.map((u) => (
              <span
                key={u.id}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 text-sm"
              >
                {u.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HoursTab({ projectId }: { projectId: string }) {
  const demoDb = useDemoDb();

  const { data: firestoreHours, loading } = useCollection<WorkHour>(
    "work_hours",
    [where("projectId", "==", projectId), orderBy("date", "desc")],
    (id, data) => ({
      id,
      projectId: (data.projectId as string) || "",
      employeeName: (data.employeeName as string) || "",
      hours: (data.hours as number) || 0,
      date: timestampToDate(data.date) || new Date(),
    })
  );

  const workHours = DEMO_MODE
    ? [...demoDb.db.work_hours.filter((wh) => wh.projectId === projectId)].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      )
    : firestoreHours;

  const totalHours = workHours.reduce((sum, wh) => sum + wh.hours, 0);

  if (!DEMO_MODE && loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 mb-4 inline-flex items-center gap-2">
        <span className="text-slate-400 text-sm">Gesamt auf dieser Baustelle:</span>
        <span className="text-white font-bold text-lg">{totalHours}h</span>
        <span className="text-slate-500 text-sm">({workHours.length} Einträge)</span>
      </div>

      {workHours.length === 0 ? (
        <div className="table-container p-8 text-center text-slate-400">
          Noch keine Arbeitszeiten eingetragen
        </div>
      ) : (
        <div className="table-container overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3">Datum</th>
                <th className="text-left px-6 py-3">Mitarbeiter</th>
                <th className="text-right px-6 py-3">Stunden</th>
              </tr>
            </thead>
            <tbody>
              {workHours.map((wh) => (
                <tr key={wh.id} className="table-row">
                  <td className="px-6 py-4 text-slate-400">
                    {format(wh.date, "dd.MM.yyyy", { locale: de })}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{wh.employeeName}</td>
                  <td className="px-6 py-4 text-right font-bold text-orange-400">
                    {wh.hours}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
