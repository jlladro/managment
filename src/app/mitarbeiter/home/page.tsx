"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronRight, HardHat, LogOut, Loader2 } from "lucide-react";
import { useEmployee } from "@/context/EmployeeContext";
import { useDemoDb } from "@/context/DemoDbContext";

export default function HomePage() {
  const { employeeName, clearEmployee } = useEmployee();
  const demoDb = useDemoDb();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const projects = [...demoDb.db.projects].sort((a, b) => a.name.localeCompare(b.name));
  const loading = !demoDb.ready;

  const filtered = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.address && p.address.toLowerCase().includes(q))
    );
  }, [projects, search]);

  useEffect(() => {
    if (!employeeName && !loading) {
      router.replace("/mitarbeiter/setup");
    }
  }, [employeeName, router, loading]);

  if (!employeeName) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E14] min-h-screen">
      {/* Premium Header */}
      <div className="px-6 pt-14 pb-6 bg-[#12161F] border-b border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <HardHat className="text-white w-7 h-7" />
             </div>
             <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Eingeloggt als</p>
                <h2 className="text-white font-bold text-lg leading-tight">{employeeName}</h2>
             </div>
          </div>
          <button 
            onClick={() => { if(confirm("Abmelden?")) { clearEmployee(); router.push("/mitarbeiter/setup"); } }}
            className="p-3 bg-white/5 rounded-xl text-slate-400 active:bg-red-500/10 active:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            className="w-full bg-[#0B0E14] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none focus:border-orange-500/50 transition-all shadow-inner"
            placeholder="Baustelle suchen..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] ml-1">Aktive Baustellen</h3>
           <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-3 py-1 rounded-full border border-orange-500/20">
             {filtered.length} GESAMT
           </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
             <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
             <p className="text-xs font-black uppercase tracking-widest">Baustellen laden...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#12161F] border border-dashed border-white/10 rounded-[32px] p-16 text-center">
             <p className="text-slate-600 font-bold text-sm">Keine Baustellen gefunden</p>
          </div>
        ) : (
          filtered.map((project) => (
            <button 
              key={project.id} 
              onClick={() => router.push(`/mitarbeiter/project/${project.id}`)} 
              className="w-full text-left bg-[#12161F] border border-white/5 hover:border-orange-500/30 active:scale-[0.98] transition-all rounded-[32px] p-6 shadow-xl flex items-center gap-5 group"
            >
              <div className={`w-3 h-3 rounded-full shadow-[0_0_12px] group-hover:scale-125 transition-transform ${project.status === 'active' ? 'bg-green-500 shadow-green-500/50' : 'bg-slate-600 shadow-slate-600/20'}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-lg leading-tight group-hover:text-orange-400 transition-colors">{project.name}</h4>
                <div className="flex items-center gap-1.5 mt-1">
                   <MapPin className="w-3 h-3 text-slate-600" />
                   <p className="text-slate-500 text-xs truncate font-medium">{project.address || "Keine Adresse"}</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                <ChevronRight className="w-6 h-6" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Global Brand Footer */}
      <div className="p-10 text-center opacity-20 pointer-events-none">
         <p className="text-[10px] font-black uppercase tracking-[0.5em]">Construction Management V2.0</p>
      </div>
    </div>
  );
}
