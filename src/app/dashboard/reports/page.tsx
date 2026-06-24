"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { de } from "date-fns/locale";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner } from "@/components/ui";
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

  // Tagesberichte (DER EINZIGE FOKUS)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-white">Tagesberichte</h1>
          <p className="text-slate-400 mt-1">Alle Einträge deiner Mitarbeiter</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700 shadow-xl">
          <Calendar className="w-5 h-5 text-orange-500 ml-2" />
          <input 
            type="month" 
            className="bg-transparent text-white border-none focus:ring-0 text-sm font-bold placeholder-slate-500" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
          />
        </div>
      </div>

      {/* Hauptbereich: Tagesberichte */}
      <div className="bg-slate-900/40 rounded-[32px] border border-slate-800 overflow-hidden shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none">
        <div className="p-6 border-b border-white/5 bg-slate-800/30 flex items-center justify-between print:bg-gray-100 print:border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-orange-400 print:text-black" />
            <h2 className="text-xl font-bold text-white print:text-black">Eingegangene Berichte</h2>
          </div>
          <span className="text-xs font-bold bg-orange-500/10 text-orange-400 px-4 py-1.5 rounded-full border border-orange-500/20 print:border-gray-300 print:text-black">
            {tagesberichte.length} Berichte
          </span>
        </div>

        {tagesberichte.length === 0 ? (
          <div className="p-24 text-center">
            <p className="text-slate-500 font-medium">Keine Berichte für diesen Monat vorhanden.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 print:divide-gray-200">
            {tagesberichte.map((wh) => (
              <div key={wh.id} className="group transition-all hover:bg-white/[0.02] print:break-inside-avoid">
                <div className="w-full p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-xl border border-slate-700 print:border-gray-300 print:bg-gray-100 print:text-black">
                      {wh.employeeName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg print:text-black">{wh.employeeName}</h3>
                      <p className="text-orange-500 text-xs font-bold uppercase tracking-wider print:text-gray-500">
                         {projectMap[wh.projectId] || "Baustelle"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold print:text-black">{format(new Date(wh.date), "EEEE, dd. MMMM", { locale: de })}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase">{wh.hours}h gearbeitet</p>
                  </div>
                </div>
                
                <div className="px-6 pb-8">
                  <div className="p-8 bg-slate-950/80 rounded-[24px] border border-white/5 relative overflow-hidden print:bg-white print:border-gray-300 print:shadow-none">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500 print:bg-black" />
                    <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-medium print:text-black">
                      "{wh.report}"
                    </p>
                    <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap gap-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] print:border-gray-200 print:text-gray-600">
                       <span>Beginn: {wh.startTime}</span>
                       <span>Ende: {wh.endTime}</span>
                       <span>Pause: {wh.pause} min</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center py-10 print:hidden">
        <button onClick={() => window.print()} className="px-10 py-5 bg-white text-black rounded-2xl font-black text-lg hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-3">
            <Printer className="w-6 h-6" /> BERICHT DRUCKEN
        </button>
      </div>
    </div>
  );
}
