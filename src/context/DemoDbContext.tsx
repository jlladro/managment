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
  // Projects
  addProject: (data: Omit<Project, "id">) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // Materials
  addMaterial: (data: Omit<Material, "id">) => Promise<Material>;
  updateMaterial: (id: string, data: Partial<Material>) => Promise<void>;
  updateMaterialQuantity: (id: string, quantity: number) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  // Work hours
  addWorkHour: (data: Omit<WorkHour, "id">) => Promise<WorkHour>;
  deleteWorkHour: (id: string) => Promise<void>;
  // Users
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
      console.warn("Offline Load");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const update = useCallback((updater: (prev: DemoDatabase) => DemoDatabase) => {
    setDb((prev) => {
      const next = updater(prev);
      saveDemoDb(next);
      return next;
    });
  }, []);

  const addProject = useCallback(async (data: Omit<Project, "id">) => {
    const project = { ...data, id: generateId("proj") };
    update(prev => ({ ...prev, projects: [...prev.projects, project] }));
    await fetch('/api/db', {
      method: 'POST',
      body: JSON.stringify({ table: 'projects', data: project })
    });
    return project;
  }, [update]);

  const addMaterial = useCallback(async (data: Omit<Material, "id">) => {
    const material = { ...data, id: generateId("mat") };
    update(prev => ({ ...prev, materials: [...prev.materials, material] }));
    await fetch('/api/db', {
      method: 'POST',
      body: JSON.stringify({ 
        table: 'materials', 
        data: {
          id: material.id,
          project_id: material.projectId,
          name: material.name,
          quantity: material.quantity,
          unit: material.unit,
          minimum: material.minimum
        } 
      })
    });
    return material;
  }, [update]);

  const addWorkHour = useCallback(async (data: Omit<WorkHour, "id">) => {
    const entry = { ...data, id: generateId("wh") };
    update(prev => ({ ...prev, work_hours: [entry, ...prev.work_hours] }));
    await fetch('/api/db', {
      method: 'POST',
      body: JSON.stringify({ 
        table: 'work_hours', 
        data: {
          id: entry.id,
          project_id: data.projectId,
          employee_name: data.employeeName,
          hours: data.hours,
          date: data.date.toISOString().split('T')[0],
          start_time: data.startTime,
          end_time: data.endTime,
          pause: data.pause
        } 
      })
    });
    return entry;
  }, [update]);

  const deleteProject = async (id:string) => {
    update(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    await fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'projects', id }) });
  };
  
  const deleteMaterial = async (id:string) => {
    update(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
    await fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'materials', id }) });
  };

  const updateMaterialQuantity = async (id:string, quantity:number) => {
    update(prev => ({ ...prev, materials: prev.materials.map(m => m.id === id ? {...m, quantity} : m) }));
    // Einfachheitshalber nutzen wir hier POST/INSERT was bei Supabase als upsert wirken kann oder wir lassen es für diesen Test
  };

  const deleteWorkHour = async (id:string) => {
    update(prev => ({ ...prev, work_hours: prev.work_hours.filter(wh => wh.id !== id) }));
    await fetch('/api/db', { method: 'DELETE', body: JSON.stringify({ table: 'work_hours', id }) });
  };

  const addUser = async (data:any) => {
    const u = {...data, id: generateId("u")};
    update(prev => ({...prev, users: [...prev.users, u]}));
    await fetch('/api/db', { method: 'POST', body: JSON.stringify({ table: 'users', data: u }) });
    return u;
  };

  return (
    <DemoDbContext.Provider value={{
      ready, db, reset: () => {}, addProject, deleteProject, updateProject: async()=>{},
      addMaterial, deleteMaterial, updateMaterialQuantity, updateMaterial: async()=>{},
      addWorkHour, deleteWorkHour, addUser, deleteUser: async()=>{}, updateUser: async()=>{},
      addMessage: (d:any)=>d, addNotification: ()=>{}
    }}>
      {children}
    </DemoDbContext.Provider>
  );
}

export function useDemoDb() { return useContext(DemoDbContext)!; }
