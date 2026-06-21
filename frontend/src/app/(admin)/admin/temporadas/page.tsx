"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const HOTEL_ID = Number(process.env.NEXT_PUBLIC_HOTEL_ID ?? 1);

interface Season {
  id: number;
  hotel_id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  multiplicador: number;
  activo: boolean;
}

const EMPTY: Omit<Season, "id" | "hotel_id" | "activo"> = {
  nombre: "",
  fecha_inicio: "",
  fecha_fin: "",
  multiplicador: 1.2,
};

export default function TemporadasPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<Season | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await apiClient
      .get<Season[]>(`/admin/seasons?hotel_id=${HOTEL_ID}`)
      .catch(() => []);
    setSeasons(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
    setError(null);
  }

  function openEdit(s: Season) {
    setEditing(s);
    setForm({ nombre: s.nombre, fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin, multiplicador: s.multiplicador });
    setShowForm(true);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await apiClient.patch(`/admin/seasons/${editing.id}`, form);
      } else {
        await apiClient.post(`/admin/seasons?hotel_id=${HOTEL_ID}`, form);
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta temporada?")) return;
    await apiClient.request(`/admin/seasons/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-900">Temporadas</h1>
          <p className="text-stone-500 text-sm mt-1">Multiplica el precio base según la época del año.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-forest-900 hover:bg-forest-700 text-white font-bold px-5 py-2.5 rounded-full text-sm transition-colors"
        >
          + Nueva temporada
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl"
          >
            <h2 className="font-serif text-xl font-bold text-forest-900 mb-5">
              {editing ? "Editar temporada" : "Nueva temporada"}
            </h2>

            <div className="space-y-4">
              <Field label="Nombre">
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Semana Santa 2026"
                  required
                  className="input"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Inicio">
                  <input
                    type="date"
                    value={form.fecha_inicio}
                    onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
                    required
                    className="input"
                  />
                </Field>
                <Field label="Fin">
                  <input
                    type="date"
                    value={form.fecha_fin}
                    onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
                    required
                    className="input"
                  />
                </Field>
              </div>
              <Field label={`Multiplicador: ×${form.multiplicador}`}>
                <input
                  type="range"
                  min={1.0}
                  max={2.5}
                  step={0.05}
                  value={form.multiplicador}
                  onChange={(e) => setForm((p) => ({ ...p, multiplicador: Number(e.target.value) }))}
                  className="w-full accent-forest-900"
                />
                <div className="flex justify-between text-xs text-stone-400 mt-1">
                  <span>×1.0 (sin cargo)</span>
                  <span className="font-bold text-forest-900">×{form.multiplicador} → +{Math.round((form.multiplicador - 1) * 100)}%</span>
                  <span>×2.5</span>
                </div>
              </Field>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border-2 border-stone-200 text-stone-600 font-semibold py-2.5 rounded-full text-sm hover:border-stone-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-forest-900 hover:bg-forest-700 text-white font-bold py-2.5 rounded-full text-sm transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 h-20 animate-pulse" />
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">🌡️</p>
          <p>No hay temporadas configuradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((s) => {
            const pct = Math.round((s.multiplicador - 1) * 100);
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-forest-900">{s.nombre}</p>
                  <p className="text-sm text-stone-400 mt-0.5">
                    {s.fecha_inicio} → {s.fecha_fin}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold text-lg ${pct > 0 ? "text-amber-600" : "text-stone-400"}`}>
                    ×{s.multiplicador}
                  </p>
                  <p className="text-xs text-stone-400">+{pct}%</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(s)}
                    className="text-xs text-stone-500 hover:text-forest-900 border border-stone-200 hover:border-forest-900/30 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</label>
      {children}
    </div>
  );
}
