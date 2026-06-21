"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const HOTEL_ID = Number(process.env.NEXT_PUBLIC_HOTEL_ID ?? 1);

interface Stats {
  reservas_hoy: number;
  checkins_pendientes: number;
  porcentaje_ocupacion: number;
  ingresos_mes: number;
  reservas_pendientes_pago: number;
}

const STAT_CARDS = (s: Stats) => [
  {
    label: "Reservas hoy",
    value: String(s.reservas_hoy),
    icon: "📋",
    color: "bg-blue-50 text-blue-700",
  },
  {
    label: "Check-ins pendientes",
    value: String(s.checkins_pendientes),
    icon: "🏨",
    color: "bg-amber-50 text-amber-700",
  },
  {
    label: "Ocupación actual",
    value: `${s.porcentaje_ocupacion}%`,
    icon: "📊",
    color: "bg-green-50 text-green-700",
  },
  {
    label: "Ingresos este mes",
    value: `$${Number(s.ingresos_mes).toLocaleString("es-CR", { minimumFractionDigits: 0 })}`,
    icon: "💵",
    color: "bg-forest-950/5 text-forest-900",
  },
  {
    label: "Pagos pendientes",
    value: String(s.reservas_pendientes_pago),
    icon: "⏳",
    color: s.reservas_pendientes_pago > 0 ? "bg-red-50 text-red-700" : "bg-stone-50 text-stone-500",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Stats>(`/admin/stats?hotel_id=${HOTEL_ID}`)
      .then(setStats)
      .catch(() => setError("No se pudieron cargar las estadísticas."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-forest-900">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">
          {new Date().toLocaleDateString("es-CR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 p-6 animate-pulse">
                <div className="h-3 w-24 bg-stone-200 rounded mb-4" />
                <div className="h-8 w-16 bg-stone-200 rounded" />
              </div>
            ))
          : stats &&
            STAT_CARDS(stats).map((card) => (
              <div key={card.label} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-stone-500">{card.label}</p>
                  <span className="text-xl">{card.icon}</span>
                </div>
                <p className={`text-3xl font-bold font-serif ${card.color.split(" ")[1]}`}>
                  {card.value}
                </p>
              </div>
            ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-widest mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/reservas", label: "Ver reservas", icon: "📋" },
            { href: "/admin/ocupacion", label: "Calendario de ocupación", icon: "📅" },
            { href: "/admin/temporadas", label: "Gestionar temporadas", icon: "🌡️" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-stone-100 hover:border-forest-900/20 hover:shadow-sm transition-all text-sm font-medium text-forest-900"
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
