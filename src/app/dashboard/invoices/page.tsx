"use client";

import { useMemo } from "react";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { FileText, Calendar, User, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function InvoicesPage() {
  const demoDb = useDemoDb();
  
  const messages = demoDb.db.messages || [];
  const projects = demoDb.db.projects || [];
  const loading = !demoDb.ready;

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

  // Wir behandeln Nachrichten als "Rechnungen/Belege"
  const invoices = useMemo(() => {
    return [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages]);

  const handleDelete = async (id: string) => {
    if (confirm("Rechnung wirklich löschen?")) {
      await demoDb.deleteMessage(id);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Eingegangene Rechnungen</h1>
          <p className="text-slate-400 mt-1">Belege und Ausgaben von Baustellen</p>
        </div>
        <span className="bg-orange-500/10 text-orange-400 px-4 py-2 rounded-xl border border-orange-500/20 font-bold">
          {invoices.length} Belege
        </span>
      </div>

      {invoices.length === 0 ? (
        <EmptyState message="Noch keine Rechnungen eingegangen." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-orange-500/30 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{inv.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
                        <Calendar className="w-3 h-3" /> {format(new Date(inv.createdAt), "dd. MMMM yyyy", { locale: de })}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-orange-500 font-bold uppercase tracking-wider">
                         Baustelle: {inv.targetProjectIds.map(id => projectMap[id]).join(", ") || "Alle"}
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-black/30 rounded-xl border border-white/5 text-slate-300 whitespace-pre-wrap italic">
                      {inv.body}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(inv.id)}
                  className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
