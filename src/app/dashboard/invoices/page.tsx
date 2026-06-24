"use client";

import { useMemo, useState } from "react";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import { FileText, Calendar, Trash2, Image as ImageIcon, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function InvoicesPage() {
  const demoDb = useDemoDb();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const messages = demoDb.db.messages || [];
  const projects = demoDb.db.projects || [];
  const loading = !demoDb.ready;

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invoices.map((inv) => {
            const imageUrl = inv.metadata?.imageUrl;
            return (
              <div key={inv.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-orange-500/30 transition-all group flex flex-col h-full">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">{inv.title}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <Calendar className="w-3 h-3" /> {format(new Date(inv.createdAt), "dd. MMMM yyyy", { locale: de })}
                        </div>
                        <div className="text-xs text-orange-500 font-bold uppercase tracking-wider">
                           Baustelle: {inv.targetProjectIds.map(id => projectMap[id]).join(", ") || "Alle"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(inv.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {imageUrl ? (
                  <div 
                    onClick={() => setSelectedImage(imageUrl)}
                    className="relative aspect-video rounded-xl bg-black/40 overflow-hidden cursor-pointer group/img border border-white/5"
                  >
                    <img src={imageUrl} alt="Rechnungsbeleg" className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                       <span className="bg-white text-black px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">
                          <ImageIcon className="w-3 h-3" /> Foto ansehen
                       </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-6 bg-black/30 rounded-xl border border-white/5 text-slate-400 text-sm italic flex items-center justify-center">
                    Kein Foto angehängt
                  </div>
                )}

                {inv.body && inv.body.trim() !== "" && (
                  <div className="mt-4 p-3 bg-white/5 rounded-xl text-slate-300 text-sm font-bold text-center">
                    {inv.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Vollbild-Vorschau Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200">
           <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 p-4 text-white hover:bg-white/10 rounded-full transition-all">
              <X className="w-8 h-8" />
           </button>
           <div className="max-w-full max-h-full relative shadow-2xl">
              <img src={selectedImage} className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl border border-white/10" />
              <div className="mt-6 flex justify-center">
                 <a href={selectedImage} target="_blank" className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
                    <ExternalLink className="w-5 h-5" /> Beleg im neuen Tab öffnen
                 </a>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
