"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import type { WorkHour } from "@/lib/types";

export default function WorkHoursPage() {
  const demoDb = useDemoDb();
  
  const workHours = [...demoDb.db.work_hours].sort((a, b) => b.date.getTime() - a.date.getTime());
  const projects = [...demoDb.db.projects].sort((a, b) => a.name.localeCompare(b.name));
  const loading = !demoDb.ready;

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
        <p className="text-slate-400 mt-1">Alle online gespeicherten Stunden</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-bold">Datum</label>
            <input type="date" className="input-field" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-bold">Mitarbeiter</label>
            <select className="input-field" value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
              <option value="">Alle</option>
              {employees.map((name) => (<option key={name} value={name}>{name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-bold">Baustelle</label>
            <select className="input-field" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">Alle</option>
              {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="Keine Arbeitszeiten online gefunden" />
      ) : (
        <>
          <div className="bg-slate-800 rounded-xl px-4 py-2 border border-slate-700 mb-4 inline-flex items-center gap-2">
            <span className="text-slate-400 text-xs">Summe:</span>
            <span className="text-orange-400 font-bold text-lg">{totalHours}h</span>
          </div>
          <div className="table-container overflow-x-auto">
            <table className="w-full text-white text-sm">
              <thead>
                <tr className="table-header">
                  <th className="text-left px-6 py-3">Datum</th>
                  <th className="text-left px-6 py-3">Mitarbeiter</th>
                  <th className="text-left px-6 py-3">Baustelle</th>
                  <th className="text-right px-6 py-3">Stunden</th>
                  <th className="text-right px-6 py-3">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((wh) => (
                  <tr key={wh.id} className="table-row border-b border-slate-700/50">
                    <td className="px-6 py-4">
                      {format(wh.date, "dd.MM.yy", { locale: de })}
                      {wh.startTime && <div className="text-[10px] text-slate-500">{wh.startTime}-{wh.endTime}</div>}
                    </td>
                    <td className="px-6 py-4 font-bold">{wh.employeeName}</td>
                    <td className="px-6 py-4 text-slate-400">{projectMap[wh.projectId]}</td>
                    <td className="px-6 py-4 text-right font-bold text-orange-400">{wh.hours}h</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { if(confirm("Löschen?")) demoDb.deleteWorkHour(wh.id); }} className="text-slate-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
