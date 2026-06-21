"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AvailabilitySearchBar() {
  const router = useRouter();
  const params = useSearchParams();

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

  const [checkin, setCheckin] = useState(params.get("checkin") ?? "");
  const [checkout, setCheckout] = useState(params.get("checkout") ?? "");
  const [adultos, setAdultos] = useState(Number(params.get("adultos") ?? 2));
  const [ninos, setNinos] = useState(Number(params.get("ninos") ?? 0));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkin || !checkout) return;
    const qs = new URLSearchParams({
      checkin,
      checkout,
      adultos: String(adultos),
      ninos: String(ninos),
    });
    router.push(`/habitaciones?${qs}`);
  }

  const fieldCls = "w-full border border-forest-700/60 bg-forest-800/70 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 [color-scheme:dark]";
  const labelCls = "block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-forest-900/90 backdrop-blur-sm rounded-2xl border border-forest-700/50 p-4 md:p-5 shadow-xl shadow-forest-950/50"
    >
      <div className="flex flex-col md:flex-row gap-3 items-end">
        {/* Check-in */}
        <div className="flex-1 min-w-0">
          <label className={labelCls}>Check-in</label>
          <input
            type="date"
            value={checkin}
            min={today}
            onChange={(e) => setCheckin(e.target.value)}
            required
            className={fieldCls}
          />
        </div>

        {/* Check-out */}
        <div className="flex-1 min-w-0">
          <label className={labelCls}>Check-out</label>
          <input
            type="date"
            value={checkout}
            min={checkin || tomorrow}
            onChange={(e) => setCheckout(e.target.value)}
            required
            className={fieldCls}
          />
        </div>

        {/* Adultos */}
        <div className="w-28 flex-shrink-0">
          <label className={labelCls}>Adultos</label>
          <select
            value={adultos}
            onChange={(e) => setAdultos(Number(e.target.value))}
            className={fieldCls}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Niños */}
        <div className="w-28 flex-shrink-0">
          <label className={labelCls}>Niños</label>
          <select
            value={ninos}
            onChange={(e) => setNinos(Number(e.target.value))}
            className={fieldCls}
          >
            {[0, 1, 2, 3].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="flex-shrink-0 bg-gold-500 hover:bg-gold-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap hover:scale-[1.02] hover:shadow-lg hover:shadow-gold-500/25"
        >
          Buscar disponibilidad
        </button>
      </div>
    </form>
  );
}
