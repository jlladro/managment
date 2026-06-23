import type {
  Project,
  Material,
  WorkHour,
  Message,
  Employee,
  Notification,
} from "./types";
import {
  DEMO_PROJECTS,
  DEMO_EMPLOYEES,
  DEMO_MATERIALS,
  DEMO_WORK_HOURS,
  DEMO_MESSAGES,
  DEMO_NOTIFICATIONS,
} from "./demo-data";

const DB_KEY = "baustellen_demo_db";
const DB_VERSION = 1;

export interface DemoDatabase {
  version: number;
  projects: Project[];
  materials: Material[];
  work_hours: WorkHour[];
  users: Employee[];
  messages: Message[];
  notifications: Notification[];
}

type StoredWorkHour = Omit<WorkHour, "date"> & { date: string };
type StoredMessage = Omit<Message, "createdAt"> & { createdAt?: string };
type StoredNotification = Omit<Notification, "createdAt"> & { createdAt?: string };

interface StoredDatabase {
  version: number;
  projects: Project[];
  materials: Material[];
  work_hours: StoredWorkHour[];
  users: Employee[];
  messages: StoredMessage[];
  notifications: StoredNotification[];
}

function getInitialDb(): DemoDatabase {
  return {
    version: DB_VERSION,
    projects: structuredClone(DEMO_PROJECTS),
    materials: structuredClone(DEMO_MATERIALS),
    work_hours: structuredClone(DEMO_WORK_HOURS),
    users: structuredClone(DEMO_EMPLOYEES),
    messages: structuredClone(DEMO_MESSAGES),
    notifications: structuredClone(DEMO_NOTIFICATIONS),
  };
}

function serialize(db: DemoDatabase): StoredDatabase {
  return {
    ...db,
    work_hours: db.work_hours.map((wh) => ({
      ...wh,
      date: wh.date.toISOString(),
    })),
    messages: db.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt?.toISOString(),
    })),
    notifications: db.notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt?.toISOString(),
    })),
  };
}

function deserialize(stored: StoredDatabase): DemoDatabase {
  return {
    ...stored,
    work_hours: stored.work_hours.map((wh) => ({
      ...wh,
      date: new Date(wh.date),
    })),
    messages: stored.messages.map((m) => ({
      ...m,
      createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
    })),
    notifications: stored.notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt ? new Date(n.createdAt) : undefined,
    })),
  };
}

export function loadDemoDb(): DemoDatabase {
  if (typeof window === "undefined") return getInitialDb();

  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial = getInitialDb();
      saveDemoDb(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as StoredDatabase;
    if (parsed.version !== DB_VERSION) {
      const initial = getInitialDb();
      saveDemoDb(initial);
      return initial;
    }
    return deserialize(parsed);
  } catch {
    const initial = getInitialDb();
    saveDemoDb(initial);
    return initial;
  }
}

export function saveDemoDb(db: DemoDatabase): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_KEY, JSON.stringify(serialize(db)));
}

export function resetDemoDb(): DemoDatabase {
  const initial = getInitialDb();
  saveDemoDb(initial);
  return initial;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
