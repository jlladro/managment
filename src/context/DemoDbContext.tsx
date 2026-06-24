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
  const [db, setDb] = useState<DemoDatabase>(loadDemoDb());
  const [ready, setReady] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const res = await fetch('/api/db');
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      
      if (data.projects) {
        setDb(prev => ({
          ...prev,
          projects: data.projects,
          materials: (data.materials || []).map((m:any) => ({
            id: m.id, projectId: m.project_id, name: m.name, quantity: Number(m.quantity), unit: m.unit, minimum: Number(m.minimum)
          })),
          work_hours: (data.workHours || []).map((wh:any) => ({
            id: wh.id, projectId: wh.project_id, employeeName: wh.employee_name, hours: Number(wh.hours || 0), date: new Date(wh.date), startTime: wh.start_time, endTime: wh.end_time || wh.endTime, pause: Number(wh.pause || 0), report: wh.report || ""
          })),
          users: data.users || [],
          messages: (data.messages || []).map((m:any) => ({
            id: m.id, title: m.title, body: m.body, targetType: m.target_type || m.targetType, targetProjectIds: m.target_project_ids || m.targetProjectIds || [], createdAt: new Date(m.created_at || m.createdAt || Date.now())
          }))
        }));
      }
    } catch (e) {
      console.warn("Background Sync failed");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const updateLocal = useCallback((updater: (prev: DemoDatabase) => DemoDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDemoDb(next);
      return next;
    });
  }, []);

  // CRUD Implementierungen
  const addProject = async (data: Omit<Project, "id">) => {
    const p = { ...data, id: generateId("proj") };
    updateLocal(prev => ({ ...prev, projects: [...prev.projects, p] }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'projects', data: p }) });
    return p;
  };

  const updateProject = async (id: string, data: Partial<Project>) => {
    updateLocal(prev => ({ ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...data } : p) }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'projects', data: { id, ...data } }) });
  };

  const deleteProject = async (id: string) => {
    updateLocal(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    await fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'projects', id }) });
  };

  const addMaterial = async (data: Omit<Material, "id">) => {
    const m = { ...data, id: generateId("mat") };
    updateLocal(prev => ({ ...prev, materials: [...prev.materials, m] }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'materials', data: { id: m.id, project_id: m.projectId, name: m.name, quantity: m.quantity, unit: m.unit, minimum: m.minimum } }) });
    return m;
  };

  const updateMaterialQuantity = async (id: string, quantity: number) => {
    const material = db.materials.find(m => m.id === id);
    if (!material) return;
    const updated = { ...material, quantity };
    updateLocal(prev => ({ ...prev, materials: prev.materials.map(m => m.id === id ? updated : m) }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'materials', data: { id: updated.id, project_id: updated.projectId, name: updated.name, quantity: updated.quantity, unit: updated.unit, minimum: updated.minimum } }) });
  };

  const updateMaterial = async (id: string, data: Partial<Material>) => {
    const material = db.materials.find(m => m.id === id);
    if (!material) return;
    const updated = { ...material, ...data };
    updateLocal(prev => ({ ...prev, materials: prev.materials.map(m => m.id === id ? updated : m) }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'materials', data: { id: updated.id, project_id: updated.projectId, name: updated.name, quantity: updated.quantity, unit: updated.unit, minimum: updated.minimum } }) });
  };
  
  const deleteMaterial = async (id: string) => {
    updateLocal(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
    await fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'materials', id }) });
  };

  const addWorkHour = async (data: Omit<WorkHour, "id">) => {
    const wh = { ...data, id: generateId("wh") };
    updateLocal(prev => ({ ...prev, work_hours: [wh, ...prev.work_hours] }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'work_hours', data: { id: wh.id, project_id: data.projectId, employee_name: data.employeeName, hours: data.hours, date: data.date.toISOString().split('T')[0], start_time: data.startTime, end_time: data.endTime, pause: data.pause, report: (data as any).report || "" } }) });
    return wh;
  };

  const deleteWorkHour = async (id: string) => {
    updateLocal(prev => ({ ...prev, work_hours: prev.work_hours.filter(wh => wh.id !== id) }));
    await fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'work_hours', id }) });
  };

  const addUser = async (data: Omit<Employee, "id">) => {
    const u = { ...data, id: generateId("u") };
    updateLocal(prev => ({ ...prev, users: [...prev.users, u] }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'users', data: u }) });
    return u;
  };

  const updateUser = async (id: string, data: Partial<Employee>) => {
    updateLocal(prev => ({ ...prev, users: prev.users.map(u => u.id === id ? { ...u, ...data } : u) }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'users', data: { id, ...data } }) });
  };

  const deleteUser = async (id: string) => {
    updateLocal(prev => ({ ...prev, users: prev.users.filter(u => u.id !== id) }));
    await fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'users', id }) });
  };

  const addMessage = async (data: any) => {
    const msg = { ...data, id: generateId("msg"), createdAt: new Date() };
    updateLocal(prev => ({ ...prev, messages: [msg, ...prev.messages] }));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'messages', data: { id: msg.id, title: data.title, body: data.body, target_type: data.targetType, target_project_ids: data.targetProjectIds } }) });
    return msg;
  };

  return (
    <DemoDbContext.Provider value={{
      ready, db, reset: () => {}, addProject, updateProject, deleteProject,
      addMaterial, updateMaterial: async()=>{}, updateMaterialQuantity, deleteMaterial,
      addWorkHour, deleteWorkHour, addUser, updateUser, deleteUser,
      addMessage, addNotification: ()=>{}
    }}>
      {children}
    </DemoDbContext.Provider>
  );
}

export function useDemoDb() { return useContext(DemoDbContext)!; }
