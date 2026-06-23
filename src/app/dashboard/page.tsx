"use client";

import { orderBy } from "firebase/firestore";
import { Building2, AlertTriangle, Users, Clock } from "lucide-react";
import { useCollection, timestampToDate } from "@/lib/hooks";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
import { StatCard, LoadingSpinner } from "@/components/ui";
import type { Project, Material, WorkHour, Notification } from "@/lib/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function DashboardPage() {
  const demoDb = useDemoDb();
  const { data: firestoreProjects, loading: loadingProjectsFs } = useCollection<Project>(
    "projects",
    [orderBy("name")],
    (id, data) => ({
      id,
      name: (data.name as string) || "",
      address: (data.address as string) || "",
      status: (data.status as Project["status"]) || "active",
      createdAt: timestampToDate(data.createdAt),
    })
  );

  const { data: firestoreMaterials, loading: loadingMaterialsFs } =
    useCollection<Material>(
      "materials",
      [orderBy("name")],
      (id, data) => ({
        id,
        projectId: (data.projectId as string) || "",
        name: (data.name as string) || "",
        quantity: (data.quantity as number) || 0,
        unit: (data.unit as string) || "Stück",
        minimum: (data.minimum as number) || 0,
      })
    );

  const { data: firestoreWorkHours, loading: loadingHoursFs } = useCollection<WorkHour>(
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

  const { data: firestoreNotifications } = useCollection<Notification>(
    "notifications",
    [orderBy("createdAt", "desc")],
    (id, data) => ({
      id,
      title: (data.title as string) || "",
      body: (data.body as string) || "",
      type: (data.type as string) || "",
      projectId: data.projectId as string | undefined,
      createdAt: timestampToDate(data.createdAt),
    })
  );

  const projects = DEMO_MODE ? demoDb.db.projects : firestoreProjects;
  const materials = DEMO_MODE ? demoDb.db.materials : firestoreMaterials;
  const workHours = DEMO_MODE ? demoDb.db.work_hours : firestoreWorkHours;
  const notifications = DEMO_MODE ? demoDb.db.notifications : firestoreNotifications;
  const loadingProjects = DEMO_MODE ? false : loadingProjectsFs;
  const loadingMaterials = DEMO_MODE ? false : loadingMaterialsFs;
  const loadingHours = DEMO_MODE ? false : loadingHoursFs;

  if (loadingProjects || loadingMaterials || loadingHours) {
    return <LoadingSpinner />;
  }

  const activeProjects = projects.filter((p) => p.status === "active");
  const lowMaterials = materials.filter((m) => m.quantity <= m.minimum);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayHours = workHours.filter((wh) => {
    const d = new Date(wh.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const totalTodayHours = todayHours.reduce((sum, wh) => sum + wh.hours, 0);
  const activeEmployees = new Set(todayHours.map((wh) => wh.employeeName)).size;
  const totalAllHours = workHours.reduce((sum, wh) => sum + wh.hours, 0);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Übersicht aller Baustellen</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Baustellen"
          value={activeProjects.length}
          subtitle={`${projects.length} gesamt`}
          icon={<Building2 className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Materialwarnungen"
          value={lowMaterials.length}
          subtitle="Unter Mindestwert"
          icon={<AlertTriangle className="w-6 h-6" />}
          color={lowMaterials.length > 0 ? "red" : "green"}
        />
        <StatCard
          title="Aktive Mitarbeiter"
          value={activeEmployees}
          subtitle="Heute eingetragen"
          icon={<Users className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Arbeitsstunden"
          value={`${totalTodayHours}h`}
          subtitle={`${totalAllHours}h gesamt`}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="table-container">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Materialwarnungen
            </h2>
          </div>
          {lowMaterials.length === 0 ? (
            <div className="p-6 text-slate-400 text-sm text-center">
              Keine Warnungen – alles in Ordnung
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {lowMaterials.slice(0, 5).map((m) => (
                <div key={m.id} className="px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{m.name}</p>
                    <p className="text-xs text-slate-400">
                      {projectMap[m.projectId] || "Unbekannte Baustelle"}
                    </p>
                  </div>
                  <span className="text-red-400 text-sm font-medium">
                    {m.quantity} / {m.minimum} {m.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="table-container">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-white">Letzte Benachrichtigungen</h2>
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-slate-400 text-sm text-center">
              Keine Benachrichtigungen
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="px-4 py-3">
                  <p className="text-white text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                  {n.createdAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      {format(n.createdAt, "dd.MM.yyyy HH:mm", { locale: de })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
