"use client";

import { useState, useMemo } from "react";
import { orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useCollection, timestampToDate } from "@/lib/hooks";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import type { WorkHour, Project } from "@/lib/types";

export default function WorkHoursPage() {
  const demoDb = useDemoDb();
  const { data: firestoreWorkHours, loading: firestoreLoading } = useCollection<WorkHour>(
    "work_hours",
    [orderBy("date", "desc")],
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

  const workHours = DEMO_MODE
    ? [...demoDb.db.work_hours].sort((a, b) => b.date.getTime() - a.date.getTime())
    : firestoreWorkHours;
  const projects = DEMO_MODE
    ? [...demoDb.db.projects].sort((a, b) => a.name.localeCompare(b.name))
    : firestoreProjects;
  const loading = DEMO_MODE ? false : firestoreLoading;

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterProject, setFilterProject] = useState("");

  const employees = useMemo(
    () => Array.from(new Set(workHours.map((wh) => wh.employeeName))).sort(),
    [workHours]
  );

  const filtered = useMemo(() => {
    return workHours.filter((wh) => {
      if (filterDate) {
        const whDate = format(wh.date, "yyyy-MM-dd");
        if (whDate !== filterDate) return false;
      }
      if (filterEmployee && wh.employeeName !== filterEmployee) return false;
      if (filterProject && wh.projectId !== filterProject) return false;
      return true;
    });
  }, [workHours, filterDate, filterEmployee, filterProject]);

  const totalHours = filtered.reduce((sum, wh) => sum + wh.hours, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Arbeitszeiten</h1>
        <p className="text-slate-400 mt-1">Übersicht aller eingetragenen Stunden</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Datum</label>
            <input
              type="date"
              className="input-field"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Mitarbeiter</label>
            <select
              className="input-field"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
            >
              <option value="">Alle Mitarbeiter</option>
              {employees.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Baustelle</label>
            <select
              className="input-field"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="">Alle Baustellen</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        {(filterDate || filterEmployee || filterProject) && (
          <button
            onClick={() => {
              setFilterDate("");
              setFilterEmployee("");
              setFilterProject("");
            }}
            className="mt-3 text-sm text-orange-400 hover:text-orange-300"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 mb-6 inline-flex items-center gap-2">
        <span className="text-slate-400 text-sm">Gesamt:</span>
        <span className="text-white font-bold text-lg">{totalHours}h</span>
        <span className="text-slate-500 text-sm">({filtered.length} Einträge)</span>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="Keine Arbeitszeiten gefunden" />
      ) : (
        <div className="table-container overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3">Datum</th>
                <th className="text-left px-6 py-3">Mitarbeiter</th>
                <th className="text-left px-6 py-3">Baustelle</th>
                <th className="text-right px-6 py-3">Stunden</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wh) => (
                <tr key={wh.id} className="table-row">
                  <td className="px-6 py-4">
                    <p className="text-white font-medium">
                      {format(wh.date, "dd.MM.yyyy", { locale: de })}
                    </p>
                    {wh.startTime && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {wh.startTime} - {wh.endTime} ({wh.pause}m Pause)
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {wh.employeeName}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {projectMap[wh.projectId] || "–"}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-orange-400">
                    {wh.hours}h
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Eintrag von ${wh.employeeName} wirklich löschen?`)) {
                          demoDb.deleteWorkHour(wh.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
