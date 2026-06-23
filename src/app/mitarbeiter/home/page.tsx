"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Sun, Moon, MapPin, ChevronRight } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";
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

  const projects = [...demoDb.db.projects].sort((a, b) => a.name.localeCompare(b.name));
  const loading = !demoDb.ready;

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

  if (!employeeName) return null;

  return (
    <div className={`flex-1 flex flex-col ${dark ? "bg-[#1A1A2E]" : "bg-slate-100"}`}>
      <div className={`px-4 pt-10 pb-3 flex items-center justify-between ${dark ? "bg-[#1A1A2E]" : "bg-white border-b"}`}>
        <h1 className={`text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>Baustellen</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setDark(!dark)} className={`p-2 rounded-lg ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => { clearEmployee(); router.push("/mitarbeiter/setup"); }} className={`text-xs px-2 py-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {employeeName}
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${dark ? "bg-[#16213E]" : "bg-white border"}`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input className={`flex-1 bg-transparent outline-none text-sm ${dark ? "text-white" : "text-slate-900"}`} placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-slate-500 text-sm">Keine Baustellen online</p>
        ) : (
          filtered.map((project) => (
            <button key={project.id} onClick={() => router.push(`/mitarbeiter/project/${project.id}`)} className={`w-full text-left rounded-2xl p-5 ${dark ? "bg-[#0F3460]" : "bg-white border shadow-sm"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot[project.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-bold ${dark ? "text-white" : "text-slate-900"}`}>{project.name}</p>
                  <p className="text-xs text-slate-500 truncate">{project.address}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-orange-500" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
