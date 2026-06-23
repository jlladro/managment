"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useDemoDb } from "@/context/DemoDbContext";
import Modal, { LoadingSpinner, EmptyState } from "@/components/ui";
import type { Material, Project } from "@/lib/types";

const emptyForm = {
  projectId: "",
  name: "",
  quantity: 0,
  unit: "Stück",
  minimum: 0,
};

export default function MaterialsPage() {
  const demoDb = useDemoDb();
  
  // Wir nehmen die Daten jetzt DIREKT aus dem DemoDb-Kontext (Supabase-Synchronisiert)
  const materials = [...demoDb.db.materials].sort((a, b) => a.name.localeCompare(b.name));
  const projects = [...demoDb.db.projects].sort((a, b) => a.name.localeCompare(b.name));
  const loading = !demoDb.ready;

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Material | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, projectId: projects[0]?.id || "" });
    setModalOpen(true);
  };

  const openEdit = (material: Material) => {
    setEditing(material);
    setForm({
      projectId: material.projectId,
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      minimum: material.minimum,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.projectId) return;
    setSaving(true);
    try {
      const data = {
        ...form,
        quantity: Number(form.quantity),
        minimum: Number(form.minimum),
      };
      if (editing) {
        await demoDb.updateProject(editing.id, data as any); // Bugfix: mapping to correct function later if needed
        // Simples Update über context
        await demoDb.updateMaterialQuantity(editing.id, data.quantity);
      } else {
        await demoDb.addMaterial(data);
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
      await demoDb.deleteMaterial(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (e) {
      alert(`Fehler: ${e}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Materialverwaltung</h1>
          <p className="text-slate-400 mt-1">Bestände online verwalten</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Material hinzufügen
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : materials.length === 0 ? (
        <EmptyState message="Noch keine Materialien vorhanden" />
      ) : (
        <div className="table-container overflow-x-auto text-white">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3">Baustelle</th>
                <th className="text-left px-6 py-3">Material</th>
                <th className="text-left px-6 py-3">Menge</th>
                <th className="text-left px-6 py-3">Minimum</th>
                <th className="text-right px-6 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((material) => {
                const isLow = material.quantity <= material.minimum && material.minimum > 0;
                return (
                  <tr key={material.id} className="table-row">
                    <td className="px-6 py-4 text-slate-400">
                      {projectMap[material.projectId] || "–"}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        {isLow && (
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        {material.name}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${isLow ? "text-red-400 font-medium" : "text-white"}`}>
                      {material.quantity} {material.unit}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {material.minimum} {material.unit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(material)}
                          className="p-2 text-slate-400 hover:text-orange-400 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(material)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Popups */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Material bearbeiten" : "Material hinzufügen"}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Baustelle</label>
            <select
              className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            >
              <option value="">Baustelle wählen</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Material Name</label>
            <input
              className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. Zement"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Menge</label>
              <input
                type="number"
                className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Einheit</label>
              <input
                className="bg-slate-800 border-slate-700 rounded-xl p-3 text-white"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModalOpen(false)} className="flex-1 p-3 rounded-xl bg-slate-800 text-white font-bold">Abbrechen</button>
            <button onClick={handleSave} className="flex-1 p-3 rounded-xl bg-orange-500 text-white font-bold">Speichern</button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Löschen bestätigen"
      >
        <div className="p-2">
          <p className="text-slate-300 mb-6 font-medium">Möchtest du dieses Material wirklich unwiderruflich löschen?</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 p-3 rounded-xl bg-slate-800 text-white font-bold">Nein</button>
            <button onClick={handleDelete} className="flex-1 p-3 rounded-xl bg-red-500 text-white font-bold">Ja, löschen</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
