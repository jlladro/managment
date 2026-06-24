"use client";

import { Building2, AlertTriangle, Users, Clock } from "lucide-react";
import { useDemoDb } from "@/context/DemoDbContext";
import { StatCard, LoadingSpinner } from "@/components/ui";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function DashboardPage() {
  const demoDb = useDemoDb();
  
  const projects = demoDb.db.projects || [];
  const materials = demoDb.db.materials || [];
  const workHours = demoDb.db.work_hours || [];
  const users = demoDb.db.users || [];
  const loading = !demoDb.ready;

  const activeProjects = projects.filter((p) => p.status === "active");
  const lowMaterials = materials.filter((m) => m.quantity <= m.minimum && m.minimum > 0);
  
  const totalEmployees = users.length;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayHours = workHours.filter((wh) => {
    const d = new Date(wh.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  
  const totalTodayHours = todayHours.reduce((sum, wh) => sum + wh.hours, 0);
  const totalAllHours = workHours.reduce((sum, wh) => sum + wh.hours, 0);
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Übersicht aller online gespeicherten Daten</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard title="Baustellen" value={activeProjects.length} subtitle={`${projects.length} gesamt`} icon={<Building2 className="w-6 h-6" />} color="blue" />
        <StatCard title="Materialwarnungen" value={lowMaterials.length} subtitle="Unter Mindestwert" icon={<AlertTriangle className="w-6 h-6" />} color={lowMaterials.length > 0 ? "red" : "green"} />
        <StatCard title="Mitarbeiter" value={totalEmployees} subtitle="Gesamtes Team" icon={<Users className="w-6 h-6" />} color="green" />
        <StatCard title="Stunden (Heute)" value={`${totalTodayHours}h`} subtitle={`${totalAllHours}h gesamt`} icon={<Clock className="w-6 h-6" />} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/20 border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-white/5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="font-semibold text-white">Materialwarnungen</h2>
          </div>
          {lowMaterials.length === 0 ? (
            <div className="p-10 text-slate-500 text-center">Alles auf Lager</div>
          ) : (
            <div className="divide-y divide-white/5">
              {lowMaterials.slice(0, 5).map((m) => (
                <div key={m.id} className="px-5 py-4 flex justify-between items-center hover:bg-white/5">
                  <div>
                    <p className="text-white font-medium">{m.name}</p>
                    <p className="text-xs text-slate-500">{projectMap[m.projectId] || "Baustelle gelöscht"}</p>
                  </div>
                  <span className="text-red-400 font-bold">{m.quantity} {m.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-800/20 border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h2 className="font-semibold text-white">Letzte Aktivitäten</h2>
          </div>
          {workHours.length === 0 ? (
            <div className="p-10 text-slate-500 text-center">Noch keine Buchungen</div>
          ) : (
            <div className="divide-y divide-white/5">
              {[...workHours].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((wh) => (
                <div key={wh.id} className="px-5 py-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-white font-medium">{wh.employeeName}</p>
                    <p className="text-xs text-slate-500">{projectMap[wh.projectId]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold">{wh.hours}h</p>
                    <p className="text-[10px] text-slate-500 font-bold">{format(new Date(wh.date), "dd.MM.yyyy")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
