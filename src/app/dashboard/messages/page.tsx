"use client";

import { useState } from "react";
import { orderBy } from "firebase/firestore";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Send } from "lucide-react";
import { db } from "@/lib/firebase";
import { useCollection, timestampToDate } from "@/lib/hooks";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
import { LoadingSpinner, EmptyState } from "@/components/ui";
import type { Message, Project } from "@/lib/types";

export default function MessagesPage() {
  const demoDb = useDemoDb();
  const { data: firestoreMessages, loading: firestoreLoading } = useCollection<Message>(
    "messages",
    [orderBy("createdAt", "desc")],
    (id, data) => ({
      id,
      title: (data.title as string) || "",
      body: (data.body as string) || "",
      targetType: (data.targetType as Message["targetType"]) || "all",
      targetProjectIds: (data.targetProjectIds as string[]) || [],
      createdAt: timestampToDate(data.createdAt),
    })
  );

  const { data: firestoreProjects } = useCollection<Project>(
    "projects",
    [orderBy("name")],
    (id, data) => ({
      id,
      name: (data.name as string) || "",
      address: (data.address as string) || "",
      status: (data.status as Project["status"]) || "active",
    })
  );

  const messages = DEMO_MODE ? demoDb.db.messages : firestoreMessages;
  const projects = DEMO_MODE
    ? [...demoDb.db.projects].sort((a, b) => a.name.localeCompare(b.name))
    : firestoreProjects;
  const loading = DEMO_MODE ? false : firestoreLoading;

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
    if (targetType === "project" && selectedProjects.length === 0) {
      alert("Bitte mindestens eine Baustelle auswählen");
      return;
    }

    setSending(true);
    try {
      if (DEMO_MODE) {
        demoDb.addMessage({
          title: title.trim(),
          body: body.trim(),
          targetType,
          targetProjectIds: targetType === "project" ? selectedProjects : [],
        });
      } else {
        await addDoc(collection(db, "messages"), {
          title: title.trim(),
          body: body.trim(),
          targetType,
          targetProjectIds: targetType === "project" ? selectedProjects : [],
          author: "Chef",
          createdAt: serverTimestamp(),
        });
      }
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Nachrichtensystem</h1>
        <p className="text-slate-400 mt-1">Nachrichten an Mitarbeiter senden</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="font-semibold text-white mb-4">Neue Nachricht</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Titel *</label>
              <input
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Betreff der Nachricht"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nachricht *</label>
              <textarea
                className="input-field resize-none"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Nachrichtentext..."
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Empfänger</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={targetType === "all"}
                    onChange={() => setTargetType("all")}
                    className="accent-orange-500"
                  />
                  <span className="text-slate-300">Alle Mitarbeiter</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={targetType === "project"}
                    onChange={() => setTargetType("project")}
                    className="accent-orange-500"
                  />
                  <span className="text-slate-300">Bestimmte Baustellen</span>
                </label>
              </div>
            </div>
            {targetType === "project" && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {projects.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(p.id)}
                      onChange={() => toggleProject(p.id)}
                      className="accent-orange-500"
                    />
                    <span className="text-slate-300 text-sm">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <Send className="w-4 h-4" />
              {sending ? "Senden..." : "Nachricht senden"}
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-white mb-4">Gesendete Nachrichten</h2>
          {loading ? (
            <LoadingSpinner />
          ) : messages.length === 0 ? (
            <EmptyState message="Noch keine Nachrichten gesendet" />
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-white">{msg.title}</p>
                    <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-lg flex-shrink-0">
                      {msg.targetType === "all"
                        ? "Alle"
                        : `${msg.targetProjectIds.length} Baustelle(n)`}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{msg.body}</p>
                  {msg.targetType === "project" && msg.targetProjectIds.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      {msg.targetProjectIds.map((id) => projectMap[id]).join(", ")}
                    </p>
                  )}
                  {msg.createdAt && (
                    <p className="text-xs text-slate-500 mt-2">
                      {format(msg.createdAt, "dd.MM.yyyy HH:mm", { locale: de })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
