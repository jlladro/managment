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
  Message,
  Employee,
  Notification,
} from "@/lib/types";
import {
  loadDemoDb,
  saveDemoDb,
  generateId,
  type DemoDatabase,
} from "@/lib/demo-db";
import { supabase } from "@/lib/supabase";

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
  // Messages
  addMessage: (data: Omit<Message, "id" | "createdAt">) => Message;
  // Notifications
  addNotification: (data: Omit<Notification, "id" | "createdAt">) => void;
}

const DemoDbContext = createContext<DemoDbContextType | null>(null);

export function DemoDbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DemoDatabase>(loadDemoDb());
  const [ready, setReady] = useState(false);

  const syncWithSupabase = useCallback(async () => {
    try {
      const [{ data: projects }, { data: materials }, { data: workHours }, { data: users }] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('materials').select('*'),
        supabase.from('work_hours').select('*'),
        supabase.from('users').select('*')
      ]);
      
      if (projects) {
        setDb(prev => ({
          ...prev,
          projects: projects.map(p => ({
            id: p.id, name: p.name, address: p.address, status: p.status, description: p.description
          })),
          materials: (materials || []).map(m => ({
            id: m.id, projectId: m.project_id, name: m.name, quantity: Number(m.quantity), unit: m.unit, minimum: Number(m.minimum)
          })),
          work_hours: (workHours || []).map(wh => ({
            id: wh.id, projectId: wh.project_id, employeeName: wh.employee_name, hours: Number(wh.hours), date: new Date(wh.date), startTime: wh.start_time, endTime: wh.end_time, pause: wh.pause
          })),
          users: (users || []).map(u => ({
            id: u.id, name: u.name, active: u.active, role: u.role
          }))
        }));
      }
    } catch (e) {
      console.warn("Offline");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

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
    await supabase.from('projects').insert({
      id: project.id, name: project.name, address: project.address, status: project.status, description: project.description
    });
    return project;
  }, [update]);

  const addMaterial = useCallback(async (data: Omit<Material, "id">) => {
    const material = { ...data, id: generateId("mat") };
    update(prev => ({ ...prev, materials: [...prev.materials, material] }));
    await supabase.from('materials').insert({
      id: material.id, project_id: material.projectId, name: material.name, quantity: material.quantity, unit: material.unit, minimum: material.minimum
    });
    return material;
  }, [update]);

  const addWorkHour = useCallback(async (data: Omit<WorkHour, "id">) => {
    const entry = { ...data, id: generateId("wh") };
    update(prev => ({ ...prev, work_hours: [entry, ...prev.work_hours] }));
    await supabase.from('work_hours').insert({
      id: entry.id, project_id: data.projectId, employee_name: data.employeeName, hours: data.hours, date: data.date.toISOString().split('T')[0], start_time: data.startTime, end_time: data.endTime, pause: data.pause
    });
    return entry;
  }, [update]);

  const reset = () => { if(confirm("Löschen?")) setDb(loadDemoDb()); };
  const deleteProject = async (id:string) => {
    update(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
    await supabase.from('projects').delete().eq('id', id);
  };
  const deleteMaterial = async (id:string) => {
    update(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
    await supabase.from('materials').delete().eq('id', id);
  };
  const updateMaterialQuantity = async (id:string, quantity:number) => {
    update(prev => ({ ...prev, materials: prev.materials.map(m => m.id === id ? {...m, quantity} : m) }));
    await supabase.from('materials').update({ quantity }).eq('id', id);
  };
  const deleteWorkHour = async (id:string) => {
    update(prev => ({ ...prev, work_hours: prev.work_hours.filter(wh => wh.id !== id) }));
    await supabase.from('work_hours').delete().eq('id', id);
  };
  const addUser = async (data:any) => {
    const u = {...data, id: generateId("u")};
    update(prev => ({...prev, users: [...prev.users, u]}));
    await supabase.from('users').insert({id: u.id, name: u.name, active: u.active, role: u.role});
    return u;
  };
  const deleteUser = async (id:string) => {
     update(prev => ({...prev, users: prev.users.filter(u => u.id !== id)}));
     await supabase.from('users').delete().eq('id', id);
  };

  const updateProject = async () => {};
  const updateMaterial = async () => {};
  const updateUser = async () => {};

  return (
    <DemoDbContext.Provider value={{
      ready, db, reset, addProject, deleteProject, updateProject,
      addMaterial, deleteMaterial, updateMaterialQuantity, updateMaterial,
      addWorkHour, deleteWorkHour, addUser, deleteUser, updateUser,
      addMessage: (d:any)=>d, addNotification: ()=>{}
    }}>
      {children}
    </DemoDbContext.Provider>
  );
}

export function useDemoDb() { return useContext(DemoDbContext)!; }
