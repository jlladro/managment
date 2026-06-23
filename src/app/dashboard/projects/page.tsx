"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, MapPin, ChevronRight } from "lucide-react";
import { useDemoDb } from "@/context/DemoDbContext";
import Modal, { LoadingSpinner, EmptyState } from "@/components/ui";
import type { Project } from "@/lib/types";
import { PROJECT_STATUS_LABELS } from "@/lib/types";

const emptyForm = {
  name: "",
  address: "",
  status: "active" as Project["status"],
  description: "",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-400",
  completed: "bg-slate-500/15 text-slate-400",
  paused: "bg-yellow-500/15 text-yellow-400",
};

const statusDot: Record<string, string> = {
  active: "bg-green-400",
  completed: "bg-slate-400",
  paused: "bg-yellow-400",
};

export default function ProjectsPage() {
  const router = useRouter();
  const demoDb = useDemoDb();
  
  // Direkter Zugriff auf die Supabase-Daten ohne Firebase-Umwege
  const projects = [...demoDb.db.projects].sort((a, b) => a.name.localeCompare(b.name));
  const loading = !demoDb.ready;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditing(project);
    setForm({
      name: project.name,
      address: project.address,
      status: project.status,
      description: project.description || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await demoDb.updateProject(editing.id, form);
      } else {
        await demoDb.addProject(form);
      }
      setModalOpen(false);
    } catch (e) {
      alert(`Fehler: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await demoDb.deleteProject(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (e) {
      alert(`Fehler: ${e}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Baustellen</h1>
          <p className="text-slate-400 mt-1">Status & Verwaltung</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Neue Baustelle
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : projects.length === 0 ? (
        <EmptyState message="Noch keine Baustellen online vorhanden" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              className="bg-slate-800 rounded-2xl p-5 border border-slate-700 hover:border-orange-500/40 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${statusDot[project.status]}`} />
                <div className="flex-1 min-w-0 text-white">
                  <p className="font-semibold text-lg">{project.name}</p>
                  {project.address && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <p className="text-slate-400 text-sm truncate">{project.address}</p>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[project.status]}`}>
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
                <div className="flex gap-1">
                  <button onClick={(e) => openEdit(e, project)} className="p-2 text-slate-400 hover:text-orange-400"><Pencil className="w-4 h-4" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project); }} className="p-2 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Popups */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Bearbeiten" : "Neu"}>
        <div className="space-y-4">
           <div><label className="text-xs text-slate-500 uppercase font-bold">Name</label>
           <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
           <div><label className="text-xs text-slate-500 uppercase font-bold">Adresse</label>
           <input className="input-field" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
           <div><label className="text-xs text-slate-500 uppercase font-bold">Status</label>
           <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
             <option value="active">Aktiv</option><option value="paused">Pausiert</option><option value="completed">Abgeschlossen</option>
           </select></div>
           <div className="flex gap-3 pt-4">
             <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Abbrechen</button>
             <button onClick={handleSave} className="btn-primary flex-1">{saving ? "Lädt..." : "Speichern"}</button>
           </div>
        </div>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Löschen?">
        <p className="text-slate-300 mb-6">Möchtest du &quot;{deleteConfirm?.name}&quot; wirklich löschen?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Nein</button>
          <button onClick={handleDelete} className="btn-danger flex-1">Ja, weg damit</button>
        </div>
      </Modal>
    </div>
  );
}
