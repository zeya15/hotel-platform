import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HOTEL } from "@/lib/hotel-config";
import { apiServer } from "@/lib/api-server";
import AvailabilitySearchBar from "@/components/AvailabilitySearchBar";
import Icon from "@/components/Icons";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: `Habitaciones — ${HOTEL.nombre}`,
  description: "Descubre nuestras habitaciones y elige la que mejor se adapte a ti.",
};

interface SearchParams {
  checkin?: string;
  checkout?: string;
  adultos?: string;
  ninos?: string;
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const hotelId = Number(process.env.NEXT_PUBLIC_HOTEL_ID ?? 1);

  const hasSearch = sp.checkin && sp.checkout;

  // Fetch availability when dates are provided, otherwise fetch all types
  let rooms: any[] = [];
  let isAvailability = false;

  if (hasSearch) {
    rooms = await apiServer
      .getAvailability({
        hotel_id: hotelId,
        check_in: sp.checkin!,
        check_out: sp.checkout!,
        adultos: Number(sp.adultos ?? 1),
        ninos: Number(sp.ninos ?? 0),
      })
      .catch(() => []);
    isAvailability = true;
  } else {
    rooms = await apiServer.getRoomTypes(hotelId).catch(() => []);
  }

  const nights =
    hasSearch
      ? Math.max(
          1,
          Math.round(
            (new Date(sp.checkout!).getTime() - new Date(sp.checkin!).getTime()) /
              86_400_000
          )
        )
      : null;

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="bg-forest-950 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-gold-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Hospedaje</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight">
              Nuestras habitaciones
            </h1>
            <p className="mt-4 text-stone-400 max-w-xl mx-auto">
              Cada espacio diseñado para conectarte con la naturaleza sin renunciar al confort.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-4xl mx-auto">
            <Suspense>
              <AvailabilitySearchBar />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── Results ──────────────────────────────────────────────────── */}
      <section className="bg-forest-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Search context label */}
          {hasSearch && (
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-stone-400 text-sm">
                  {rooms.length === 0
                    ? "Sin disponibilidad para esas fechas"
                    : `${rooms.length} tipo${rooms.length > 1 ? "s" : ""} disponible${rooms.length > 1 ? "s" : ""}`}
                  {nights && ` · ${nights} noche${nights > 1 ? "s" : ""}`}
                  {sp.adultos && ` · ${sp.adultos} adulto${Number(sp.adultos) > 1 ? "s" : ""}`}
                  {sp.ninos && Number(sp.ninos) > 0 && `, ${sp.ninos} niño${Number(sp.ninos) > 1 ? "s" : ""}`}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {sp.checkin} → {sp.checkout}
                </p>
              </div>
              <Link
                href="/habitaciones"
                className="text-xs text-stone-500 hover:text-white underline transition-colors"
              >
                Ver todas las habitaciones
              </Link>
            </div>
          )}

          {rooms.length === 0 ? (
            <EmptyState hasSearch={!!hasSearch} />
          ) : (
            <div className="space-y-10">
              {rooms.map((item: any, index: number) => {
                const rt = isAvailability ? item.room_type : item;
                const price = isAvailability ? item.precio_calculado : item.precio_base;
                const available = isAvailability ? item.rooms_disponibles : null;
                const season = isAvailability ? item.temporada_activa : null;
                const multiplier = isAvailability ? item.multiplicador : 1;

                return (
                  <Reveal key={rt.id} animation="fade-up" delay={index * 60}>
                    <RoomRow
                      rt={rt}
                      price={price}
                      nights={nights}
                      available={available}
                      season={season}
                      multiplier={multiplier}
                      checkin={sp.checkin}
                      checkout={sp.checkout}
                      adultos={Number(sp.adultos ?? 1)}
                      ninos={Number(sp.ninos ?? 0)}
                      reversed={index % 2 !== 0}
                    />
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-forest-900 py-14 text-center">
        <p className="text-gold-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">¿Tienes dudas?</p>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-6">
          Nuestro equipo te ayuda a elegir
        </h2>
        <a
          href={`https://wa.me/${HOTEL.whatsapp}?text=${encodeURIComponent(HOTEL.whatsappMensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-8 py-4 rounded-full transition-colors shadow-lg text-sm uppercase tracking-widest"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 32 32">
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.494.651 4.836 1.789 6.867L2 30l7.363-1.768A13.936 13.936 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.33 18.97c-.347-.173-2.053-1.013-2.373-1.129-.32-.116-.553-.173-.786.173-.232.347-.9 1.129-1.103 1.362-.203.232-.405.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.92-1.727-2.056-1.93-2.403-.202-.347-.021-.535.152-.707.156-.155.347-.405.52-.607.173-.203.231-.347.347-.578.115-.232.058-.434-.029-.607-.087-.173-.786-1.895-1.077-2.594-.283-.681-.571-.589-.786-.6l-.67-.011c-.232 0-.607.087-.925.434-.319.347-1.217 1.19-1.217 2.9s1.246 3.365 1.42 3.597c.173.232 2.452 3.743 5.942 5.25.831.359 1.48.573 1.986.734.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.344-1.651.29-.812.29-1.508.202-1.652-.087-.144-.319-.231-.666-.405z"/>
          </svg>
          Consultar por WhatsApp
        </a>
      </section>
    </>
  );
}

/* ─── RoomRow ────────────────────────────────────────────────────────────── */

function RoomRow({
  rt,
  price,
  nights,
  available,
  season,
  multiplier,
  checkin,
  checkout,
  adultos,
  ninos,
  reversed,
}: {
  rt: any;
  price: number;
  nights: number | null;
  available: number | null;
  season: string | null;
  multiplier: number;
  checkin?: string;
  checkout?: string;
  adultos: number;
  ninos: number;
  reversed: boolean;
}) {
  const amenidades: string[] = rt.amenidades ?? [];
  const hasSearch = checkin && checkout;

  const bookingHref = hasSearch
    ? `/reservar?room_type_id=${rt.id}&checkin=${checkin}&checkout=${checkout}&adultos=${adultos}&ninos=${ninos}&price=${price}`
    : `/habitaciones/${rt.id}`;

  return (
    <article
      className={`flex flex-col ${reversed ? "lg:flex-row-reverse" : "lg:flex-row"} rounded-3xl overflow-hidden bg-forest-900 border border-forest-700/40 shadow-lg shadow-forest-950/40 hover:shadow-2xl hover:shadow-forest-950/60 hover:-translate-y-1 transition-all duration-500 group`}
    >
      {/* Image */}
      <div
        className="w-full lg:w-2/5 min-h-[280px] lg:min-h-[340px] bg-forest-800 relative flex-shrink-0 overflow-hidden"
        style={{
          backgroundImage: rt.imagen_url
            ? `url('${rt.imagen_url}'), linear-gradient(135deg, #1a3d26, #0b1e11)`
            : `linear-gradient(135deg, #1a3d26, #0b1e11)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-forest-950/0 group-hover:bg-forest-950/15 transition-colors duration-500" />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-forest-950/70 backdrop-blur border border-white/10 rounded-full px-3 py-1 text-xs font-bold text-stone-200">
            Hasta {rt.capacidad_max} personas
          </span>
          {season && multiplier > 1 && (
            <span className="bg-gold-500 text-white rounded-full px-3 py-1 text-xs font-bold">
              {season}
            </span>
          )}
        </div>
        {available !== null && (
          <div className="absolute top-4 right-4 bg-forest-900/80 backdrop-blur border border-white/10 text-stone-200 rounded-full px-3 py-1 text-xs font-semibold">
            {available} disponible{available > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-8 lg:p-10 flex flex-col justify-between">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white group-hover:text-gold-400 transition-colors mb-3 leading-tight">
            {rt.nombre}
          </h2>
          {rt.descripcion && (
            <p className="text-stone-400 leading-relaxed mb-5 text-[15px]">{rt.descripcion}</p>
          )}
          {amenidades.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {amenidades.map((a: string) => (
                <span key={a} className="inline-flex items-center gap-1.5 text-xs bg-forest-800/70 border border-forest-700/50 text-stone-300 px-3 py-1 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-gold-400 flex-shrink-0" />
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pt-4 border-t border-forest-700/40">
          <div>
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-0.5">
              {hasSearch ? `Total ${nights} noche${(nights ?? 0) > 1 ? "s" : ""}` : "Precio desde"}
            </p>
            <p className="text-3xl font-bold text-white tracking-tight">
              ${Number(price).toFixed(0)}
            </p>
            {!hasSearch && <p className="text-stone-500 text-xs">/ noche</p>}
          </div>

          <Link
            href={bookingHref}
            className={`font-bold px-7 py-3 rounded-full text-sm transition-all flex items-center gap-2 group/btn hover:scale-105 ${
              hasSearch
                ? "bg-gold-500 hover:bg-gold-400 text-white shadow-md shadow-gold-500/25"
                : "bg-forest-700 hover:bg-forest-600 text-white border border-forest-600/60"
            }`}
          >
            {hasSearch ? "Reservar" : "Ver detalles"}
            <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="text-center py-24">
      <div className="mb-4 flex justify-center">
        <Icon name={hasSearch ? "sad" : "leaf"} className="w-12 h-12 text-stone-500" />
      </div>
      <h2 className="font-serif text-2xl font-bold text-white mb-2">
        {hasSearch ? "Sin disponibilidad" : "Próximamente"}
      </h2>
      <p className="text-stone-400 max-w-sm mx-auto">
        {hasSearch
          ? "No hay habitaciones disponibles para esas fechas. Prueba otras fechas o contáctanos."
          : "Estamos preparando nuestras habitaciones. Contáctanos para reservar directamente."}
      </p>
      <a
        href={`https://wa.me/${HOTEL.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-6 bg-gold-500 hover:bg-gold-400 text-white font-bold px-7 py-3 rounded-full text-sm transition-all hover:scale-105"
      >
        Consultar por WhatsApp
      </a>
    </div>
  );
}
