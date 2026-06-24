"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Send } from "lucide-react";
import { useDemoDb } from "@/context/DemoDbContext";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import type { Message, Project } from "@/lib/types";

export default function MessagesPage() {
  const demoDb = useDemoDb();
  
  const messages = demoDb.db.messages || [];
  const projects = [...(demoDb.db.projects || [])].sort((a, b) => a.name.localeCompare(b.name));
  const loading = !demoDb.ready;

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<"all" | "project">("all");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      await demoDb.addMessage({
        title: title.trim(),
        body: body.trim(),
        targetType,
        targetProjectIds: targetType === "project" ? selectedProjects : [],
        createdAt: new Date(),
      });
      setTitle("");
      setBody("");
      setSelectedProjects([]);
      setTargetType("all");
    } catch (e) {
      alert(`Fehler: ${e}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Nachrichtensystem</h1>
        <p className="text-slate-400 mt-1">Informationen online an Mitarbeiter senden</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/20 rounded-3xl p-6 border border-slate-700/50">
          <h2 className="font-semibold text-white mb-4">Neue Nachricht</h2>
          <div className="space-y-4">
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titel" />
            <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white resize-none" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Deine Nachricht..." />
            
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer text-sm">
                <input type="radio" checked={targetType === "all"} onChange={() => setTargetType("all")} className="accent-orange-500" /> Alle
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer text-sm">
                <input type="radio" checked={targetType === "project"} onChange={() => setTargetType("project")} className="accent-orange-500" /> Baustellen
              </label>
            </div>

            {targetType === "project" && (
              <div className="space-y-2 max-h-40 overflow-y-auto p-3 bg-black/20 rounded-xl">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 cursor-pointer text-sm text-slate-300">
                    <input type="checkbox" checked={selectedProjects.includes(p.id)} onChange={() => toggleProject(p.id)} className="accent-orange-500" />
                    {p.name}
                  </label>
                ))}
              </div>
            )}

            <button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> {sending ? "Sendet..." : "Nachricht senden"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-white mb-4">Verlauf</h2>
          {messages.length === 0 ? (
            <div className="p-10 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700 text-slate-500 text-center">Noch keine Nachrichten gesendet</div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-slate-800/20 rounded-2xl p-4 border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-white text-sm">{msg.title}</p>
                    <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded uppercase font-bold">{msg.targetType === "all" ? "Alle" : "Auswahl"}</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{msg.body}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{format(new Date(msg.createdAt || new Date()), "dd.MM.yyyy HH:mm")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
