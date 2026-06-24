"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type {
  Project,
  Material,
  WorkHour,
  Employee,
} from "@/lib/types";
import {
  loadDemoDb,
  saveDemoDb,
  generateId,
  type DemoDatabase,
} from "@/lib/demo-db";

interface DemoDbContextType {
  ready: boolean;
  db: DemoDatabase;
  reset: () => void;
  addProject: (data: Omit<Project, "id">) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMaterial: (data: Omit<Material, "id">) => Promise<Material>;
  updateMaterial: (id: string, data: Partial<Material>) => Promise<void>;
  updateMaterialQuantity: (id: string, quantity: number) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addWorkHour: (data: Omit<WorkHour, "id">) => Promise<WorkHour>;
  deleteWorkHour: (id: string) => Promise<void>;
  addUser: (data: Omit<Employee, "id">) => Promise<Employee>;
  updateUser: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addMessage: (data: any) => any;
  addNotification: (data: any) => void;
}

const DemoDbContext = createContext<DemoDbContextType | null>(null);

export function DemoDbProvider({ children }: { children: ReactNode }) {
  // Wir starten SOFORT mit den lokalen Daten, damit es KEINE Ladezeit gibt
  const [db, setDb] = useState<DemoDatabase>(loadDemoDb());
  const [ready, setReady] = useState(true);

  const loadAllData = useCallback(async () => {
    console.log("Background Sync startet...");
    try {
      const res = await fetch('/api/db');
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.projects) {
        setDb(prev => ({
          ...prev,
          projects: data.projects,
          materials: (data.materials || []).map((m:any) => ({
            id: m.id, projectId: m.project_id, name: m.name, quantity: Number(m.quantity), unit: m.unit, minimum: Number(m.minimum)
          })),
          work_hours: (data.workHours || []).map((wh:any) => ({
            id: wh.id, projectId: wh.project_id, employeeName: wh.employee_name, hours: Number(wh.hours), date: new Date(wh.date), startTime: wh.start_time, endTime: wh.end_time, pause: wh.pause
          })),
          users: data.users || []
        }));
      }
    } catch (e) {
      console.warn("Sync failed");
    }
  }, []);

  useEffect(() => {
    // Kurze Verzögerung beim Start, um den Haupt-Thread nicht zu blockieren
    const t = setTimeout(loadAllData, 500);
    return () => clearTimeout(t);
  }, [loadAllData]);

  // UI-Update-Funktion (Sofort-Reaktion)
  const update = useCallback((updater: (prev: DemoDatabase) => DemoDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDemoDb(next);
      return next;
    });
  }, []);

  // CRUD Funktionen mit Hintergrund-POST
  const addProject = async (data: Omit<Project, "id">) => {
    const p = { ...data, id: generateId("proj") };
    update(prev => ({ ...prev, projects: [...prev.projects, p] }));
    fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'projects', data: p }) });
    return p;
  };

  const addMaterial = async (data: Omit<Material, "id">) => {
    const m = { ...data, id: generateId("mat") };
    update(prev => ({ ...prev, materials: [...prev.materials, m] }));
    fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'materials', data: { id: m.id, project_id: m.projectId, name: m.name, quantity: m.quantity, unit: m.unit, minimum: m.minimum } }) });
    return m;
  };

  const addWorkHour = async (data: Omit<WorkHour, "id">) => {
    const wh = { ...data, id: generateId("wh") };
    update(prev => ({ ...prev, work_hours: [wh, ...prev.work_hours] }));
    fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'work_hours', data: { id: wh.id, project_id: data.projectId, employee_name: data.employeeName, hours: data.hours, date: data.date.toISOString().split('T')[0], start_time: data.startTime, end_time: data.endTime, pause: data.pause } }) });
    return wh;
  };

  const deleteProject = async (id:string) => {
    update(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'projects', id }) });
  };
  
  const deleteMaterial = async (id:string) => {
    update(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
    fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'materials', id }) });
  };

  const deleteWorkHour = async (id:string) => {
    update(prev => ({ ...prev, work_hours: prev.work_hours.filter(wh => wh.id !== id) }));
    fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'work_hours', id }) });
  };

  const addUser = async (data:any) => {
    const u = {...data, id: generateId("u")};
    update(prev => ({...prev, users: [...prev.users, u]}));
    fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'users', data: u }) });
    return u;
  };

  return (
    <DemoDbContext.Provider value={{
      ready: true, db, reset: () => {}, addProject, deleteProject, updateProject: async()=>{},
      addMaterial, deleteMaterial, updateMaterialQuantity: async()=>{}, updateMaterial: async()=>{},
      addWorkHour, deleteWorkHour, addUser, deleteUser: async()=>{}, updateUser: async()=>{},
      addMessage: (d:any)=>d, addNotification: ()=>{}
    }}>
      {children}
    </DemoDbContext.Provider>
  );
}

export function useDemoDb() { return useContext(DemoDbContext)!; }
