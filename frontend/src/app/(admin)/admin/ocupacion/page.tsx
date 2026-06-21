"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const HOTEL_ID = Number(process.env.NEXT_PUBLIC_HOTEL_ID ?? 1);

interface OccupancyResponse {
  hotel_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  grid: Record<string, Record<string, string>>;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function formatDayHeader(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return {
    day: d.toLocaleDateString("es-CR", { weekday: "short" }).slice(0, 2),
    num: d.getDate(),
    isToday: dateStr === new Date().toISOString().split("T")[0],
    isWeekend: d.getDay() === 0 || d.getDay() === 6,
  };
}

export default function OcupacionPage() {
  const [data, setData] = useState<OccupancyResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<OccupancyResponse>(`/bookings/admin/occupancy?hotel_id=${HOTEL_ID}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-bold text-forest-900 mb-8">Ocupación</h1>
        <div className="bg-white rounded-2xl border border-stone-100 h-64 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-bold text-forest-900 mb-8">Ocupación</h1>
        <p className="text-stone-400">No se pudo cargar la grilla de ocupación.</p>
      </div>
    );
  }

  const roomIds = Object.keys(data.grid);
  const today = new Date().toISOString().split("T")[0];

  // Build array of 30 dates
  const dates: string[] = [];
  for (let i = 0; i < 30; i++) {
    dates.push(addDays(data.fecha_inicio, i));
  }

  const occupied = roomIds.reduce((acc, id) => {
    const roomDates = data.grid[id] ?? {};
    acc[id] = Object.values(roomDates).filter((v) => v === "ocupada").length;
    return acc;
  }, {} as Record<string, number>);

  const totalCells = roomIds.length * 30;
  const occupiedCells = Object.values(occupied).reduce((a, b) => a + b, 0);
  const globalPct = totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-forest-900">Ocupación</h1>
          <p className="text-stone-500 text-sm mt-1">
            {roomIds.length} habitaciones · próximos 30 días · {globalPct}% ocupado
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-forest-800 inline-block" /> Ocupada</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-stone-100 border border-stone-200 inline-block" /> Libre</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gold-400 inline-block" /> Hoy</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse min-w-max w-full">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-stone-50 border-b border-r border-stone-200 px-4 py-3 text-left font-semibold text-stone-500 min-w-[120px]">
                  Habitación
                </th>
                {dates.map((d) => {
                  const { day, num, isToday, isWeekend } = formatDayHeader(d);
                  return (
                    <th
                      key={d}
                      className={`border-b border-stone-200 px-1 py-2 text-center font-medium min-w-[32px] ${
                        isToday
                          ? "bg-gold-400/20 text-gold-600"
                          : isWeekend
                          ? "bg-stone-50 text-stone-400"
                          : "text-stone-500"
                      }`}
                    >
                      <div className="leading-none">{day}</div>
                      <div className={`font-bold mt-0.5 ${isToday ? "text-gold-600" : ""}`}>{num}</div>
                    </th>
                  );
                })}
                <th className="border-b border-l border-stone-200 px-3 py-3 text-center font-semibold text-stone-500">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {roomIds.map((roomId) => {
                const roomDates = data.grid[roomId] ?? {};
                const pct = Math.round((occupied[roomId] / 30) * 100);

                return (
                  <tr key={roomId} className="hover:bg-stone-50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white border-b border-r border-stone-100 px-4 py-2 font-medium text-forest-900">
                      Hab. {roomId}
                    </td>
                    {dates.map((d) => {
                      const status = roomDates[d] ?? "libre";
                      const isToday = d === today;
                      return (
                        <td
                          key={d}
                          title={`Hab ${roomId} · ${d} · ${status}`}
                          className={`border-b border-stone-100 p-0.5 text-center`}
                        >
                          <div
                            className={`w-6 h-6 rounded mx-auto transition-colors ${
                              status === "ocupada"
                                ? "bg-forest-800"
                                : isToday
                                ? "bg-gold-300/40 border border-gold-400"
                                : "bg-stone-100"
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className={`border-b border-l border-stone-100 px-3 py-2 text-center font-bold ${
                      pct >= 80 ? "text-red-600" : pct >= 50 ? "text-amber-600" : "text-green-600"
                    }`}>
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
