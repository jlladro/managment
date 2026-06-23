"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Sun, Moon, MapPin, ChevronRight } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
import { orderBy } from "firebase/firestore";
import { useCollection } from "@/lib/hooks";
import type { Project } from "@/lib/types";
import { PROJECT_STATUS_LABELS } from "@/lib/types";

const statusColors: Record<string, string> = {
  active: "bg-[#2ECC71]/15 text-[#2ECC71]",
  completed: "bg-slate-500/15 text-slate-400",
  paused: "bg-[#F39C12]/15 text-[#F39C12]",
};

const statusDot: Record<string, string> = {
  active: "bg-[#2ECC71]",
  completed: "bg-slate-400",
  paused: "bg-[#F39C12]",
};

export default function HomePage() {
  const { employeeName, clearEmployee } = useEmployee();
  const demoDb = useDemoDb();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(true);

  const { data: firestoreProjects, loading } = useCollection<Project>(
    "projects",
    [orderBy("name")],
    (id, data) => ({
      id,
      name: (data.name as string) || "",
      address: (data.address as string) || "",
      status: (data.status as Project["status"]) || "active",
    })
  );

  const projects = DEMO_MODE ? demoDb.db.projects : firestoreProjects;

  const filtered = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );
  }, [projects, search]);

  useEffect(() => {
    if (!employeeName) {
      router.replace("/mitarbeiter/setup");
    }
  }, [employeeName, router]);

  if (!employeeName) {
    return null;
  }

  return (
    <div className={`flex-1 flex flex-col ${dark ? "bg-[#1A1A2E]" : "bg-slate-100"}`}>
      <div className={`px-4 pt-10 pb-3 flex items-center justify-between ${dark ? "bg-[#1A1A2E]" : "bg-white border-b"}`}>
        <h1 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
          Baustellen
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDark(!dark)}
            className={`p-2 rounded-lg ${dark ? "text-slate-400 hover:text-white" : "text-slate-500"}`}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              clearEmployee();
              router.push("/mitarbeiter/setup");
            }}
            className={`text-xs px-2 py-1 rounded-lg ${dark ? "text-slate-400 hover:bg-[#0F3460]" : "text-slate-500"}`}
          >
            {employeeName}
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${dark ? "bg-[#16213E]" : "bg-white border"}`}>
          <Search className={`w-4 h-4 ${dark ? "text-slate-400" : "text-slate-500"}`} />
          <input
            className={`flex-1 bg-transparent outline-none text-sm ${dark ? "text-white placeholder-slate-500" : "text-slate-900"}`}
            placeholder="Baustelle suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {!DEMO_MODE && loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]" />
          </div>
        ) : filtered.length === 0 ? (
          <p className={`text-center py-12 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {search ? "Keine Baustellen gefunden" : "Noch keine Baustellen"}
          </p>
        ) : (
          filtered.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => router.push(`/mitarbeiter/project/${project.id}`)}
              className={`w-full text-left rounded-2xl p-5 transition-colors active:scale-[0.98] ${
                dark ? "bg-[#0F3460] hover:bg-[#16213E] active:bg-[#16213E]" : "bg-white border hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusDot[project.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-base ${dark ? "text-white" : "text-slate-900"}`}>
                    {project.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className={`w-3 h-3 flex-shrink-0 ${dark ? "text-slate-500" : "text-slate-400"}`} />
                    <p className={`text-xs truncate ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {project.address}
                    </p>
                  </div>
                  <p className={`text-xs mt-2 ${dark ? "text-[#FF6B35]" : "text-orange-600"}`}>
                    Tippen für Material & Stunden →
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${statusColors[project.status]}`}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
                <ChevronRight className={`w-6 h-6 flex-shrink-0 ${dark ? "text-[#FF6B35]" : "text-orange-500"}`} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
