"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const HOTEL_ID = Number(process.env.NEXT_PUBLIC_HOTEL_ID ?? 1);

interface RoomType {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  capacidad_max: number;
  imagen_url: string | null;
  amenidades: string[] | null;
  activo: boolean;
}

export default function HabitacionesAdminPage() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amenidadInput, setAmenidadInput] = useState("");

  async function load() {
    setLoading(true);
    const data = await apiClient
      .get<RoomType[]>(`/rooms/types?hotel_id=${HOTEL_ID}`)
      .catch(() => []);
    setRooms(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(rt: RoomType) {
    setEditing({ ...rt, amenidades: rt.amenidades ?? [] });
    setAmenidadInput("");
    setError(null);
  }

  function addAmenidad() {
    const v = amenidadInput.trim();
    if (!v || !editing) return;
    setEditing((p) => p ? { ...p, amenidades: [...(p.amenidades ?? []), v] } : p);
    setAmenidadInput("");
  }

  function removeAmenidad(i: number) {
    setEditing((p) => p ? { ...p, amenidades: (p.amenidades ?? []).filter((_, idx) => idx !== i) } : p);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.patch(`/admin/room-types/${editing.id}`, {
        nombre: editing.nombre,
        descripcion: editing.descripcion,
        precio_base: editing.precio_base,
        imagen_url: editing.imagen_url || null,
        amenidades: editing.amenidades,
        activo: editing.activo,
      });
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-forest-900">Habitaciones</h1>
        <p className="text-stone-500 text-sm mt-1">Gestiona tipos de habitación, precios y amenidades.</p>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl p-7 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-serif text-xl font-bold text-forest-900 mb-5">Editar habitación</h2>

            <div className="space-y-4">
              <Field label="Nombre">
                <input className="input" type="text" value={editing.nombre}
                  onChange={(e) => setEditing((p) => p ? { ...p, nombre: e.target.value } : p)} required />
              </Field>

              <Field label="Descripción">
                <textarea className="input resize-none" rows={3} value={editing.descripcion ?? ""}
                  onChange={(e) => setEditing((p) => p ? { ...p, descripcion: e.target.value } : p)} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Precio base (USD)">
                  <input className="input" type="number" min={1} step={0.01} value={editing.precio_base}
                    onChange={(e) => setEditing((p) => p ? { ...p, precio_base: Number(e.target.value) } : p)} required />
                </Field>
                <Field label="Estado">
                  <select className="input" value={editing.activo ? "1" : "0"}
                    onChange={(e) => setEditing((p) => p ? { ...p, activo: e.target.value === "1" } : p)}>
                    <option value="1">Activa</option>
                    <option value="0">Inactiva</option>
                  </select>
                </Field>
              </div>

              <Field label="URL de imagen (opcional)">
                <input className="input" type="url" value={editing.imagen_url ?? ""}
                  placeholder="https://…"
                  onChange={(e) => setEditing((p) => p ? { ...p, imagen_url: e.target.value } : p)} />
              </Field>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">
                  Amenidades
                </label>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                  {(editing.amenidades ?? []).map((a, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-forest-950/5 border border-forest-900/10 text-forest-900 px-3 py-1 rounded-full">
                      {a}
                      <button type="button" onClick={() => removeAmenidad(i)} className="text-stone-400 hover:text-red-500 ml-1">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    value={amenidadInput}
                    onChange={(e) => setAmenidadInput(e.target.value)}
                    placeholder="WiFi, Aire acondicionado…"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenidad(); } }}
                  />
                  <button type="button" onClick={addAmenidad}
                    className="bg-forest-900 text-white text-sm font-bold px-4 rounded-xl hover:bg-forest-700 transition-colors">
                    +
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setEditing(null)}
                className="flex-1 border-2 border-stone-200 text-stone-600 font-semibold py-2.5 rounded-full text-sm hover:border-stone-400 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-forest-900 hover:bg-forest-700 text-white font-bold py-2.5 rounded-full text-sm transition-colors disabled:opacity-50">
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((rt) => (
            <div key={rt.id} className={`bg-white rounded-2xl border p-5 shadow-sm flex items-center gap-4 ${rt.activo ? "border-stone-100" : "border-stone-200 opacity-60"}`}>
              {/* Image swatch */}
              <div
                className="w-16 h-16 rounded-xl bg-forest-800 flex-shrink-0"
                style={rt.imagen_url ? {
                  backgroundImage: `url('${rt.imagen_url}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                } : {}}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-forest-900">{rt.nombre}</p>
                  {!rt.activo && <span className="text-xs bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">Inactiva</span>}
                </div>
                <p className="text-sm text-stone-400 mt-0.5">
                  ${Number(rt.precio_base).toFixed(0)}/noche · {rt.capacidad_max} personas
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(rt.amenidades ?? []).slice(0, 4).map((a) => (
                    <span key={a} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{a}</span>
                  ))}
                  {(rt.amenidades?.length ?? 0) > 4 && (
                    <span className="text-xs text-stone-400 px-2 py-0.5">+{(rt.amenidades?.length ?? 0) - 4}</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => openEdit(rt)}
                className="flex-shrink-0 text-xs text-stone-500 hover:text-forest-900 border border-stone-200 hover:border-forest-900/30 px-4 py-2 rounded-full transition-colors font-medium"
              >
                Editar
              </button>
            </div>
          ))}
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
