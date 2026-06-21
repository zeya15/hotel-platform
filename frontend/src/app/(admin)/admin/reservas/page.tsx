"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const HOTEL_ID = Number(process.env.NEXT_PUBLIC_HOTEL_ID ?? 1);

const ESTADOS = ["", "PENDING_PAYMENT", "AWAITING_MANUAL_PAYMENT", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED", "CANCELLED", "EXPIRED"];

const ESTADO_STYLE: Record<string, string> = {
  PENDING_PAYMENT:          "bg-yellow-100 text-yellow-700",
  AWAITING_MANUAL_PAYMENT:  "bg-blue-100 text-blue-700",
  CONFIRMED:                "bg-green-100 text-green-700",
  CHECKED_IN:               "bg-teal-100 text-teal-700",
  CHECKED_OUT:              "bg-stone-100 text-stone-600",
  COMPLETED:                "bg-stone-100 text-stone-500",
  CANCELLED:                "bg-red-100 text-red-600",
  EXPIRED:                  "bg-stone-100 text-stone-400",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDING_PAYMENT:          "Pago pendiente",
  AWAITING_MANUAL_PAYMENT:  "Verificando SINPE",
  CONFIRMED:                "Confirmada",
  CHECKED_IN:               "En hotel",
  CHECKED_OUT:              "Check-out hecho",
  COMPLETED:                "Completada",
  CANCELLED:                "Cancelada",
  EXPIRED:                  "Expirada",
};

const NEXT_ACTIONS: Record<string, { label: string; estado: string; color: string }[]> = {
  PENDING_PAYMENT:         [{ label: "Confirmar", estado: "CONFIRMED", color: "bg-green-600" }, { label: "Cancelar", estado: "CANCELLED", color: "bg-red-600" }],
  AWAITING_MANUAL_PAYMENT: [{ label: "Confirmar SINPE", estado: "CONFIRMED", color: "bg-green-600" }, { label: "Cancelar", estado: "CANCELLED", color: "bg-red-600" }],
  CONFIRMED:               [{ label: "Check-in", estado: "CHECKED_IN", color: "bg-teal-600" }, { label: "Cancelar", estado: "CANCELLED", color: "bg-red-600" }],
  CHECKED_IN:              [{ label: "Check-out", estado: "CHECKED_OUT", color: "bg-stone-600" }],
  CHECKED_OUT:             [{ label: "Completar", estado: "COMPLETED", color: "bg-stone-600" }],
};

interface Reservation {
  id: number;
  check_in: string;
  check_out: string;
  adultos: number;
  ninos: number;
  estado: string;
  total: number;
  moneda: string;
  notas_internas: string | null;
  guest: { id: number; nombre: string; email: string; telefono: string | null } | null;
}

export default function ReservasPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const qs = filter ? `&estado=${filter}` : "";
    const data = await apiClient
      .get<Reservation[]>(`/admin/reservations?hotel_id=${HOTEL_ID}${qs}`)
      .catch(() => []);
    setReservations(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function changeStatus(id: number, estado: string) {
    setActionLoading(id);
    try {
      await apiClient.patch(`/admin/reservations/${id}/status`, { estado });
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-900">Reservas</h1>
          <p className="text-stone-500 text-sm mt-1">{reservations.length} reserva{reservations.length !== 1 ? "s" : ""}</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.filter(Boolean).map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e] ?? e}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 h-20 animate-pulse" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-4xl mb-3">📋</p>
          <p>No hay reservas{filter ? " con ese estado" : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const nights = Math.round(
              (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86_400_000
            );
            const actions = NEXT_ACTIONS[r.estado] ?? [];

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-forest-900">#{r.id}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ESTADO_STYLE[r.estado] ?? "bg-stone-100 text-stone-600"}`}>
                        {ESTADO_LABEL[r.estado] ?? r.estado}
                      </span>
                    </div>

                    {r.guest && (
                      <p className="font-semibold text-stone-800 text-sm truncate">{r.guest.nombre}</p>
                    )}
                    <p className="text-stone-400 text-xs mt-0.5">
                      {r.guest?.email}
                      {r.guest?.telefono ? ` · ${r.guest.telefono}` : ""}
                    </p>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-stone-500">
                      <span>📅 {r.check_in} → {r.check_out} ({nights}n)</span>
                      <span>👥 {r.adultos}A{r.ninos > 0 ? ` ${r.ninos}N` : ""}</span>
                      <span className="font-semibold text-forest-900">${Number(r.total).toFixed(0)} {r.moneda}</span>
                    </div>

                    {r.notas_internas && (
                      <p className="text-xs text-stone-400 mt-1 italic">"{r.notas_internas}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      {actions.map((action) => (
                        <button
                          key={action.estado}
                          onClick={() => changeStatus(r.id, action.estado)}
                          disabled={actionLoading === r.id}
                          className={`${action.color} hover:opacity-80 text-white text-xs font-bold px-4 py-2 rounded-full transition-opacity disabled:opacity-50`}
                        >
                          {actionLoading === r.id ? "…" : action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
