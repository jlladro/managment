"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { Printer, Calendar, FileText, ChevronDown, ChevronUp } from "lucide-react";

export default function ReportsPage() {
  const demoDb = useDemoDb();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [expandedReports, setExpandedReports] = useState<string[]>([]);

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
    return workHours.filter(wh => {
      try {
        const d = new Date(wh.date);
        return isWithinInterval(d, monthInterval);
      } catch { return false; }
    });
  }, [workHours, monthInterval]);

  // Gruppierung für Statistiken (nur klein am Rand/unten)
  const byEmployee = useMemo(() => {
    const map: Record<string, number> = {};
    filteredHours.forEach(wh => {
      map[wh.employeeName] = (map[wh.employeeName] || 0) + wh.hours;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredHours]);

  // Tagesberichte (HAUPTFOKUS)
  const tagesberichte = useMemo(() => {
    return filteredHours
      .filter(wh => wh.report && wh.report.trim() !== "")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredHours]);

  const toggleReport = (id: string) => {
    setExpandedReports(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Tagesberichte</h1>
          <p className="text-slate-400 mt-1">Alle Einträge deiner Mitarbeiter</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl">
          <Calendar className="w-5 h-5 text-orange-500 ml-2" />
          <input 
            type="month" 
            className="bg-transparent text-white border-none focus:ring-0 text-sm font-bold" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
          />
        </div>
      </div>

      {/* Hauptbereich: Tagesberichte */}
      <div className="bg-slate-900/40 rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-slate-800/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Eingegangene Berichte</h2>
          </div>
          <span className="text-xs font-bold bg-orange-500/10 text-orange-400 px-4 py-1.5 rounded-full border border-orange-500/20">
            {tagesberichte.length} Berichte gefunden
          </span>
        </div>

        {tagesberichte.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-slate-700" />
            </div>
            <p className="text-slate-500 font-medium">Keine Berichte für diesen Monat vorhanden.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tagesberichte.map((wh) => (
              <div key={wh.id} className="group transition-all hover:bg-white/[0.02]">
                <button 
                  onClick={() => toggleReport(wh.id)}
                  className="w-full p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-xl border border-slate-600 shadow-lg group-hover:border-orange-500/50 transition-all">
                      {wh.employeeName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{wh.employeeName}</h3>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                         <span className="text-orange-500/80">{projectMap[wh.projectId] || "Baustelle"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-8 w-full md:w-auto">
                    <div className="text-right">
                      <p className="text-white font-bold">{format(new Date(wh.date), "EEEE, dd. MMMM", { locale: de })}</p>
                      <p className="text-xs text-slate-500 font-black uppercase tracking-tighter">{wh.hours}h gearbeitet</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 transition-all ${expandedReports.includes(wh.id) ? "rotate-180 bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20" : "text-slate-500"}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </button>
                {expandedReports.includes(wh.id) && (
                  <div className="px-6 pb-8 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-8 bg-slate-950/80 rounded-[24px] border border-white/5 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
                      <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                        "{wh.report}"
                      </p>
                      <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                         <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"/> Beginn: {wh.startTime}</span>
                         <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"/> Ende: {wh.endTime}</span>
                         <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"/> Pause: {wh.pause} min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zusammenfassung unten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-slate-900/30 rounded-3xl border border-slate-800 p-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Stunden / Mitarbeiter</h3>
            <div className="space-y-2">
               {byEmployee.map(([name, hours]) => (
                 <div key={name} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-white font-bold">{name}</span>
                    <span className="text-orange-400 font-black">{hours}h</span>
                 </div>
               ))}
            </div>
         </div>
         <div className="flex items-center justify-center">
            <button onClick={() => window.print()} className="w-full md:w-auto px-10 py-5 bg-white text-black rounded-2xl font-black text-lg hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95">
                BERICHT DRUCKEN
            </button>
         </div>
      </div>
    </div>
  );
}
