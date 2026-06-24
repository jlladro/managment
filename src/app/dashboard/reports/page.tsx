"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { Printer, Calendar } from "lucide-react";

export default function ReportsPage() {
  const demoDb = useDemoDb();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const workHours = demoDb.db.work_hours || [];
  const projects = demoDb.db.projects || [];
  const loading = !demoDb.ready;

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
      isWithinInterval(new Date(wh.date), monthInterval)
    );
  }, [workHours, monthInterval]);

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
      const name = projectMap[wh.projectId] || "Gelöscht";
      map[name] = (map[name] || 0) + wh.hours;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredHours, projectMap]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Monatsberichte</h1>
          <p className="text-slate-400 mt-1">Stundenauswertung nach Monat</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <Calendar className="w-4 h-4 text-orange-500 ml-2" />
          <input type="month" className="bg-transparent text-white border-none focus:ring-0 text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
        </div>
      </div>

      {filteredHours.length === 0 ? (
        <EmptyState message={`Keine Daten für ${format(monthInterval.start, "MMMM yyyy", { locale: de })}`} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-white font-bold flex items-center gap-2">👤 Mitarbeiter</h2>
              <span className="text-xs font-bold text-orange-500">{byEmployee.length} Personen</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase text-slate-500 bg-white/5">
                <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4 text-right">Stunden</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {byEmployee.map(([name, hours]) => (
                  <tr key={name} className="text-white">
                    <td className="px-6 py-4">{name}</td>
                    <td className="px-6 py-4 text-right text-orange-400 font-bold">{hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-white font-bold flex items-center gap-2">🏗 Baustellen</h2>
              <span className="text-xs font-bold text-blue-500">{byProject.length} Baustellen</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase text-slate-500 bg-white/5">
                <tr><th className="px-6 py-4">Baustelle</th><th className="px-6 py-4 text-right">Stunden</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {byProject.map(([name, hours]) => (
                  <tr key={name} className="text-white">
                    <td className="px-6 py-4">{name}</td>
                    <td className="px-6 py-4 text-right text-blue-400 font-bold">{hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredHours.length > 0 && (
        <div className="mt-8 flex justify-end">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold border border-slate-700">
            <Printer className="w-4 h-4" /> Drucken
          </button>
        </div>
      )}
    </div>
  );
}
