"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { Printer, Calendar, FileText, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  const demoDb = useDemoDb();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [expandedReports, setExpandedReports] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);

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

  // Gruppierung für Statistiken (Optional einblendbar)
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

  // Tagesberichte filtern (HAUPTFOKUS)
  const tagesberichte = useMemo(() => {
    return filteredHours
      .filter(wh => wh.report && wh.report.trim() !== "")
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredHours]);

  const toggleReport = (id: string) => {
    setExpandedReports(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tagesberichte</h1>
          <p className="text-slate-400 mt-1">Überblick über die täglichen Arbeiten</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowStats(!showStats)}
            className={`p-2 rounded-xl border transition-all ${showStats ? "bg-orange-500 border-orange-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400"}`}
            title="Statistiken ein/ausblenden"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-xl border border-slate-700">
            <Calendar className="w-4 h-4 text-orange-500 ml-2" />
            <input type="month" className="bg-transparent text-white border-none focus:ring-0 text-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </div>
        </div>
      </div>

      {showStats && filteredHours.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-white text-xs font-bold uppercase tracking-wider">Stunden pro Mitarbeiter</h2>
            </div>
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-white/5">
                {byEmployee.map(([name, hours]) => (
                  <tr key={name} className="text-white"><td className="px-6 py-3">{name}</td><td className="px-6 py-3 text-right text-orange-400 font-bold">{hours}h</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-white text-xs font-bold uppercase tracking-wider">Stunden pro Baustelle</h2>
            </div>
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-white/5">
                {byProject.map(([name, hours]) => (
                  <tr key={name} className="text-white"><td className="px-6 py-3">{name}</td><td className="px-6 py-3 text-right text-blue-400 font-bold">{hours}h</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-800/30">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-400" />
             </div>
             <div>
                <h2 className="text-white font-bold">Arbeitsberichte</h2>
                <p className="text-xs text-slate-500">{format(monthInterval.start, "MMMM yyyy", { locale: de })}</p>
             </div>
          </div>
          <span className="text-xs font-bold bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full">{tagesberichte.length} Berichte</span>
        </div>
        
        {tagesberichte.length === 0 ? (
          <div className="p-20 text-center">
            <div className="inline-flex w-16 h-16 bg-slate-800 rounded-full items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-500">Keine Tagesberichte für diesen Zeitraum gefunden</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tagesberichte.map((wh) => (
              <div key={wh.id} className="group">
                <button 
                  onClick={() => toggleReport(wh.id)}
                  className="w-full p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-bold border border-slate-700 group-hover:border-orange-500/50 transition-colors">
                      {wh.employeeName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{wh.employeeName}</h3>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">{projectMap[wh.projectId] || "Baustelle"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{format(wh.date, "EEEE, dd.MM.", { locale: de })}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{wh.hours} Arbeitsstunden</p>
                    </div>
                    <div className={`p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-orange-500/30 transition-all ${expandedReports.includes(wh.id) ? "rotate-180 bg-orange-500/10 border-orange-500/30 text-orange-400" : "text-slate-500"}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>
                {expandedReports.includes(wh.id) && (
                  <div className="px-6 pb-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 bg-slate-950/50 rounded-2xl border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {wh.report}
                      </p>
                      <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         {wh.startTime && <span>Beginn: {wh.startTime}</span>}
                         {wh.endTime && <span>Ende: {wh.endTime}</span>}
                         {wh.pause && <span>Pause: {wh.pause}min</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold border border-slate-700 hover:bg-slate-750 transition-colors">
          <Printer className="w-4 h-4" /> Bericht drucken
        </button>
      </div>
    </div>
  );
}
