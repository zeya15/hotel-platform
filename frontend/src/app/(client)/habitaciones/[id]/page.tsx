import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HOTEL } from "@/lib/hotel-config";
import { apiServer } from "@/lib/api-server";
import Icon from "@/components/Icons";
import Reveal from "@/components/Reveal";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const rt = await apiServer.getRoomType(Number(id)).catch(() => null);
  if (!rt) return { title: "Habitación no encontrada" };
  return {
    title: `${rt.nombre} — ${HOTEL.nombre}`,
    description: rt.descripcion ?? `Reserva la habitación ${rt.nombre} en ${HOTEL.nombre}`,
  };
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rt = await apiServer.getRoomType(Number(id)).catch(() => null);
  if (!rt) notFound();

  const amenidades: string[] = rt.amenidades ?? [];

  const whatsappText = encodeURIComponent(
    `Hola! Me interesa reservar la habitación "${rt.nombre}" en ${HOTEL.nombre}. ¿Podrían ayudarme?`
  );

  return (
    <>
      {/* ── Hero imagen ──────────────────────────────────────────────── */}
      <div
        className="relative h-[50vh] min-h-[340px] bg-forest-900"
        style={{
          backgroundImage: rt.imagen_url
            ? `url('${rt.imagen_url}'), linear-gradient(135deg, #1a3d26, #0b1e11)`
            : `linear-gradient(135deg, #1a3d26, #0b1e11)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-7xl px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-white/70 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/habitaciones" className="hover:text-white transition-colors">Habitaciones</Link>
            <span>/</span>
            <span className="text-white font-medium">{rt.nombre}</span>
          </nav>
        </div>

        {/* Room name overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-7xl px-4 sm:px-6">
          <p className="text-gold-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Habitación</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight">
            {rt.nombre}
          </h1>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <section className="bg-forest-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Main info */}
          <div className="lg:col-span-2 space-y-10">

            {/* Description */}
            <Reveal animation="fade-up">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white mb-4">Descripción</h2>
                <p className="text-stone-400 leading-relaxed text-base">
                  {rt.descripcion ?? "Una habitación diseñada para brindar la máxima comodidad en el corazón del bosque tropical."}
                </p>
              </div>
            </Reveal>

            {/* Capacity */}
            <Reveal animation="fade-up" delay={80}>
              <div className="flex items-center gap-4 p-5 bg-forest-900 rounded-2xl border border-forest-700/40">
                <Icon name="users" className="w-8 h-8 text-gold-400" />
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest">Capacidad</p>
                  <p className="font-bold text-white text-lg">Hasta {rt.capacidad_max} personas</p>
                </div>
              </div>
            </Reveal>

            {/* Amenidades */}
            {amenidades.length > 0 && (
              <Reveal animation="fade-up" delay={120}>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white mb-5">Comodidades incluidas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {amenidades.map((a: string) => (
                      <div key={a} className="flex items-center gap-3 p-3 bg-forest-900 rounded-xl border border-forest-700/40 hover:border-gold-500/30 transition-colors">
                        <span className="w-2 h-2 rounded-full bg-gold-400 flex-shrink-0" />
                        <span className="text-sm text-stone-300 font-medium">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* Policies */}
            <Reveal animation="fade-up" delay={160}>
            <div className="bg-forest-900 rounded-2xl border border-forest-700/40 p-6 space-y-4">
              <h2 className="font-serif text-xl font-bold text-white">Políticas de estadía</h2>
              <ul className="space-y-2 text-sm text-stone-400">
                {[
                  "Check-in: 3:00 PM — Check-out: 11:00 AM",
                  "Se admiten mascotas previa consulta",
                  "Cancelación gratuita hasta 48 horas antes",
                  "Pago de reserva: 30% al confirmar, saldo al check-in",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 text-gold-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            </Reveal>
          </div>

          {/* Sidebar: booking CTA */}
          <Reveal animation="slide-left" delay={100}>
          <aside className="space-y-6">
            <div className="bg-forest-900 rounded-3xl border border-forest-700/40 shadow-lg shadow-forest-950/40 p-7 sticky top-24">
              <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Precio desde</p>
              <p className="text-4xl font-bold text-white mb-1 tracking-tight">
                ${Number(rt.precio_base).toFixed(0)}
              </p>
              <p className="text-sm text-stone-500 mb-6">por noche / habitación</p>

              <Link
                href="/habitaciones"
                className="block w-full text-center bg-gold-500 hover:bg-gold-400 text-white font-bold py-3.5 rounded-full text-sm uppercase tracking-widest transition-all mb-3 hover:scale-[1.02] hover:shadow-lg hover:shadow-gold-500/25"
              >
                Verificar disponibilidad
              </Link>

              <a
                href={`https://wa.me/${HOTEL.whatsapp}?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border border-[#25D366]/60 text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold py-3 rounded-full text-sm transition-all hover:scale-[1.02]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 32 32">
                  <path d="M16 2C8.268 2 2 8.268 2 16c0 2.494.651 4.836 1.789 6.867L2 30l7.363-1.768A13.936 13.936 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.33 18.97c-.347-.173-2.053-1.013-2.373-1.129-.32-.116-.553-.173-.786.173-.232.347-.9 1.129-1.103 1.362-.203.232-.405.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.92-1.727-2.056-1.93-2.403-.202-.347-.021-.535.152-.707.156-.155.347-.405.52-.607.173-.203.231-.347.347-.578.115-.232.058-.434-.029-.607-.087-.173-.786-1.895-1.077-2.594-.283-.681-.571-.589-.786-.6l-.67-.011c-.232 0-.607.087-.925.434-.319.347-1.217 1.19-1.217 2.9s1.246 3.365 1.42 3.597c.173.232 2.452 3.743 5.942 5.25.831.359 1.48.573 1.986.734.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.344-1.651.29-.812.29-1.508.202-1.652-.087-.144-.319-.231-.666-.405z"/>
                </svg>
                Reservar por WhatsApp
              </a>

              <div className="mt-6 pt-5 border-t border-forest-700/40 space-y-2">
                {[
                  { icon: "check", text: "Cancelación flexible" },
                  { icon: "lock", text: "Reserva segura" },
                  { icon: "building", text: "Mejor precio directo" },
                ].map((item) => (
                  <p key={item.text} className="text-xs text-stone-500 flex items-center gap-2">
                    <Icon name={item.icon} className="w-3.5 h-3.5 text-gold-400" /> {item.text}
                  </p>
                ))}
              </div>
            </div>

            {/* Back link */}
            <Link
              href="/habitaciones"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-white transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Ver todas las habitaciones
            </Link>
          </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
