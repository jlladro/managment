import type { Project, Material, WorkHour, Message, Employee, Notification } from "../src/lib/types";

export const DEMO_MODE =
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "YOUR_API_KEY";

export const DEMO_PROJECTS: Project[] = [
  {
    id: "demo-1",
    name: "Neubau Musterstraße 12",
    address: "Musterstraße 12, 80331 München",
    status: "active",
    description: "Wohnungsneubau, 4 Stockwerke",
  },
  {
    id: "demo-2",
    name: "Sanierung Altbau Hauptstr.",
    address: "Hauptstraße 45, 80333 München",
    status: "active",
    description: "Komplettsanierung Fassade und Dach",
  },
  {
    id: "demo-3",
    name: "Parkplatz Erweiterung",
    address: "Industrieweg 8, 80339 München",
    status: "paused",
  },
];

export const DEMO_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Max Mustermann", active: true, role: "employee" },
  { id: "e2", name: "Ali Yilmaz", active: true, role: "employee" },
  { id: "e3", name: "Tom Schmidt", active: true, role: "employee" },
  { id: "e4", name: "Lisa Weber", active: true, role: "employee" },
];

export const DEMO_MATERIALS: Material[] = [
  { id: "m1", projectId: "demo-1", name: "Zement", quantity: 10, unit: "kg", minimum: 5 },
  { id: "m2", projectId: "demo-1", name: "Schrauben", quantity: 500, unit: "Stück", minimum: 100 },
  { id: "m3", projectId: "demo-1", name: "Beton", quantity: 2, unit: "m³", minimum: 1 },
  { id: "m4", projectId: "demo-2", name: "Dämmung", quantity: 20, unit: "m²", minimum: 10 },
  { id: "m5", projectId: "demo-2", name: "Farbe", quantity: 3, unit: "Liter", minimum: 2 },
  { id: "m6", projectId: "demo-2", name: "Zement", quantity: 4, unit: "kg", minimum: 5 },
];

export const DEMO_WORK_HOURS: WorkHour[] = [
  {
    id: "wh1",
    projectId: "demo-1",
    employeeName: "Max Mustermann",
    hours: 8,
    date: new Date(),
  },
  {
    id: "wh2",
    projectId: "demo-1",
    employeeName: "Ali Yilmaz",
    hours: 6,
    date: new Date(),
  },
];

export const DEMO_MESSAGES: Message[] = [
  {
    id: "msg1",
    title: "Willkommen!",
    body: "Die Baustellen-App ist jetzt aktiv. Bitte tragt eure Stunden täglich ein.",
    targetType: "all",
    targetProjectIds: [],
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "msg2",
    title: "Hinweis Musterstraße",
    body: "Morgen kommt der Lieferant mit neuem Zement. Bitte Lagerplatz freimachen.",
    targetType: "project",
    targetProjectIds: ["demo-1"],
    createdAt: new Date(),
  },
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Materialwarnung",
    body: "Sanierung Altbau Hauptstr.: Zement fast leer (4 kg)",
    type: "material_low",
    projectId: "demo-2",
    createdAt: new Date(),
  },
];
