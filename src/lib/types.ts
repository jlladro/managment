export interface Project {
  id: string;
  name: string;
  address: string;
  status: "active" | "completed" | "paused";
  description?: string;
  createdAt?: Date;
}

export interface Material {
  id: string;
  projectId: string;
  name: string;
  quantity: number;
  unit: string;
  minimum: number;
}

export interface WorkHour {
  id: string;
  projectId: string;
  employeeName: string;
  hours: number;
  date: Date;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  pause?: number;     // minutes
  report?: string;    // Tagesbericht
}

export interface Message {
  id: string;
  title: string;
  body: string;
  targetType: "all" | "project";
  targetProjectIds: string[];
  createdAt?: Date;
}

export interface Employee {
  id: string;
  name: string;
  active: boolean;
  role: "employee" | "chef";
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  projectId?: string;
  createdAt?: Date;
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  completed: "Abgeschlossen",
  paused: "Pausiert",
};
