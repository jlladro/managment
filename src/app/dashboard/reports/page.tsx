"use client";

import { useState, useMemo } from "react";
import { orderBy } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { useCollection, timestampToDate } from "@/lib/hooks";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import type { WorkHour, Project } from "@/lib/types";
import { Printer, Calendar } from "lucide-react";

export default function ReportsPage() {
  const demoDb = useDemoDb();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: firestoreWorkHours, loading: loadingHours } = useCollection<WorkHour>(
    "work_hours",
    [orderBy("date", "desc")],
    (id, data) => ({
      id,
      projectId: (data.projectId as string) || "",
      employeeName: (data.employeeName as string) || "",
      hours: (data.hours as number) || 0,
      date: timestampToDate(data.date) || new Date(),
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

  const workHours = DEMO_MODE ? demoDb.db.work_hours : firestoreWorkHours;
  const projects = DEMO_MODE ? demoDb.db.projects : firestoreProjects;

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

  const monthInterval = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  }, [selectedMonth]);

  const filteredHours = useMemo(() => {
    return workHours.filter(wh => 
      isWithinInterval(wh.date, monthInterval)
    );
  }, [workHours, monthInterval]);

  // Grouping
  const byEmployee = useMemo(() => {
    const map: Record<string, number> = {};
    filteredHours.forEach(wh => {
      map[wh.employeeName] = (map[wh.employeeName] || 0) + wh.hours;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredHours]);

  const byProject = useMemo(() => {
    const map: Record<string, number> = {};
    filteredHours.forEach(wh => {
      const name = projectMap[wh.projectId] || "Unbekannt";
      map[name] = (map[name] || 0) + wh.hours;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredHours, projectMap]);

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monatsberichte</h1>
          <p className="text-slate-400 mt-1">Stundenauswertung nach Monat</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <Calendar className="w-4 h-4 text-orange-500 ml-2" />
          <input
            type="month"
            className="bg-transparent text-white border-none focus:ring-0 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
      </div>

      {loadingHours && !DEMO_MODE ? (
        <LoadingSpinner />
      ) : filteredHours.length === 0 ? (
        <EmptyState message={`Keine Daten für ${format(monthInterval.start, "MMMM yyyy", { locale: de })}`} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pro Mitarbeiter */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h2 className="text-white font-bold flex items-center gap-2">
                👤 Stunden pro Mitarbeiter
              </h2>
              <span className="text-xs font-bold text-orange-500 px-2 py-1 bg-orange-500/10 rounded-lg">
                {byEmployee.length} Personen
              </span>
            </div>
            <div className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800 bg-slate-900/50">
                    <th className="px-6 py-4 font-bold">Mitarbeiter</th>
                    <th className="px-6 py-4 font-bold text-right">Summe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {byEmployee.map(([name, hours]) => (
                    <tr key={name} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{name}</td>
                      <td className="px-6 py-4 text-right text-orange-400 font-bold text-lg">{hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pro Baustelle */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
              <h2 className="text-white font-bold flex items-center gap-2">
                🏗 Stunden pro Baustelle
              </h2>
              <span className="text-xs font-bold text-blue-500 px-2 py-1 bg-blue-500/10 rounded-lg">
                {byProject.length} Baustellen
              </span>
            </div>
            <div className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800 bg-slate-900/50">
                    <th className="px-6 py-4 font-bold">Baustelle</th>
                    <th className="px-6 py-4 font-bold text-right">Summe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {byProject.map(([name, hours]) => (
                    <tr key={name} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{name}</td>
                      <td className="px-6 py-4 text-right text-blue-400 font-bold text-lg">{hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {filteredHours.length > 0 && (
        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            Drucken
          </button>
        </div>
      )}
    </div>
  );
}
