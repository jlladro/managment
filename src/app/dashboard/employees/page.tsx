"use client";

import { useState } from "react";
import { orderBy } from "firebase/firestore";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { db } from "@/lib/firebase";
import { useCollection } from "@/lib/hooks";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";
import Modal, { LoadingSpinner, EmptyState } from "@/components/ui";
import type { Employee } from "@/lib/types";

const emptyForm = { name: "", active: true };

export default function EmployeesPage() {
  const demoDb = useDemoDb();
  const { data: firestoreEmployees, loading: firestoreLoading } = useCollection<Employee>(
    "users",
    [orderBy("name")],
    (id, data) => ({
      id,
      name: (data.name as string) || "",
      active: (data.active as boolean) ?? true,
      role: (data.role as Employee["role"]) || "employee",
    })
  );

  const employees = DEMO_MODE
    ? [...demoDb.db.users].sort((a, b) => a.name.localeCompare(b.name))
    : firestoreEmployees;
  const loading = DEMO_MODE ? false : firestoreLoading;

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
      if (DEMO_MODE) {
        if (editing) {
          demoDb.updateUser(editing.id, {
            name: form.name.trim(),
            active: form.active,
          });
        } else {
          demoDb.addUser({
            name: form.name.trim(),
            active: form.active,
            role: "employee",
          });
        }
      } else if (editing) {
        await updateDoc(doc(db, "users", editing.id), {
          name: form.name.trim(),
          active: form.active,
        });
      } else {
        await addDoc(collection(db, "users"), {
          name: form.name.trim(),
          active: form.active,
          role: "employee",
          createdAt: serverTimestamp(),
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
      if (DEMO_MODE) {
        demoDb.deleteUser(deleteConfirm.id);
      } else {
        await deleteDoc(doc(db, "users", deleteConfirm.id));
      }
      setDeleteConfirm(null);
    } catch (e) {
      alert(`Fehler: ${e}`);
    }
  };

  const toggleActive = async (employee: Employee) => {
    try {
      if (DEMO_MODE) {
        demoDb.updateUser(employee.id, { active: !employee.active });
      } else {
        await updateDoc(doc(db, "users", employee.id), {
          active: !employee.active,
        });
      }
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
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Mitarbeiter hinzufügen
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : employees.length === 0 ? (
        <EmptyState message="Noch keine Mitarbeiter angelegt" />
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="table-row">
                  <td className="px-6 py-4 font-medium text-white">
                    {employee.name}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(employee)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        employee.active
                          ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                          : "bg-slate-500/15 text-slate-400 hover:bg-slate-500/25"
                      }`}
                    >
                      {employee.active ? (
                        <><UserCheck className="w-3 h-3" /> Aktiv</>
                      ) : (
                        <><UserX className="w-3 h-3" /> Inaktiv</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(employee)}
                        className="p-2 text-slate-400 hover:text-orange-400 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(employee)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      >
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Mitarbeiter bearbeiten" : "Mitarbeiter hinzufügen"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name *</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. Max Mustermann"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="accent-orange-500"
            />
            <span className="text-slate-300">Aktiv</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="btn-primary flex-1"
            >
              {saving ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Mitarbeiter löschen"
      >
        <p className="text-slate-300 mb-6">
          Möchtest du &quot;{deleteConfirm?.name}&quot; wirklich löschen?
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
            Abbrechen
          </button>
          <button onClick={handleDelete} className="btn-danger flex-1">
            Löschen
          </button>
        </div>
      </Modal>
    </div>
  );
}
