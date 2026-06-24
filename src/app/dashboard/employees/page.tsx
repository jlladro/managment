"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useDemoDb } from "@/context/DemoDbContext";
import Modal, { LoadingSpinner, EmptyState } from "@/components/ui";
import type { Employee } from "@/lib/types";

const emptyForm = { name: "", active: true };

export default function EmployeesPage() {
  const demoDb = useDemoDb();
  
  // Wir nutzen die neue globale Datenbank
  const employees = [...demoDb.db.users].sort((a, b) => a.name.localeCompare(b.name));
  const loading = !demoDb.ready;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setForm({ name: employee.name, active: employee.active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await demoDb.updateUser(editing.id, {
          name: form.name.trim(),
          active: form.active,
        });
      } else {
        await demoDb.addUser({
          name: form.name.trim(),
          active: form.active,
          role: "employee",
        });
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
      await demoDb.deleteUser(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (e) {
      alert(`Fehler: ${e}`);
    }
  };

  const toggleActive = async (employee: Employee) => {
    try {
      await demoDb.updateUser(employee.id, { active: !employee.active });
    } catch (e) {
      alert(`Fehler: ${e}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mitarbeiter</h1>
          <p className="text-slate-400 mt-1">Mitarbeiter verwalten</p>
        </div>
        <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-colors">
          <Plus className="w-4 h-4" />
          Mitarbeiter hinzufügen
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-slate-700/50">
          <p className="text-slate-500">Noch keine Mitarbeiter angelegt</p>
        </div>
      ) : (
        <div className="bg-slate-800/20 rounded-3xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-4 font-bold">Name</th>
                <th className="text-left px-6 py-4 font-bold">Status</th>
                <th className="text-right px-6 py-4 font-bold">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(employee)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        employee.active
                          ? "bg-green-500/15 text-green-400"
                          : "bg-slate-500/15 text-slate-400"
                      }`}
                    >
                      {employee.active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                      {employee.active ? "Aktiv" : "Inaktiv"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(employee)} className="p-2 text-slate-400 hover:text-orange-400">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(employee)} className="p-2 text-slate-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Mitarbeiter bearbeiten" : "Mitarbeiter hinzufügen"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl">Abbrechen</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold">
              {saving ? "Lädt..." : "Speichern"}
            </button>
          </div>
        </div>
      </Modal>

      {deleteConfirm && (
        <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Mitarbeiter löschen">
           <p className="text-slate-300 mb-6">Möchtest du "{deleteConfirm.name}" wirklich entfernen?</p>
           <div className="flex gap-3">
             <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-800 text-white py-3 rounded-xl">Abbrechen</button>
             <button onClick={handleDelete} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold">Löschen</button>
           </div>
        </Modal>
      )}
    </div>
  );
}
