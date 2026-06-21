import type { Metadata } from "next";
import Link from "next/link";
import { HOTEL } from "@/lib/hotel-config";
import { apiServer } from "@/lib/api-server";
import ContactForm from "@/components/ContactForm";
import Icon from "@/components/Icons";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: `${HOTEL.nombre} — ${HOTEL.tagline}`,
  description: HOTEL.descripcion,
  openGraph: {
    title: HOTEL.nombre,
    description: HOTEL.tagline,
    images: [HOTEL.imagenes.hero],
  },
};

export const revalidate = 3600;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function SectionLabel({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.3em] mb-3 flex items-center gap-3 text-gold-400 ${center ? "justify-center" : ""}`}>
      <span className="h-px w-8 bg-gold-400/60" />
      {children}
      <span className="h-px w-8 bg-gold-400/60" />
    </p>
  );
}

function SectionTitle({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <h2 className={`font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white ${center ? "text-center" : ""}`}>
      {children}
    </h2>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const hotelId = Number(process.env.NEXT_PUBLIC_HOTEL_ID ?? 1);
  const roomTypes = await apiServer.getRoomTypes(hotelId).catch(() => []);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative h-screen -mt-16 flex items-center justify-center overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover scale-[1.06]"
          style={{ filter: "blur(3px)" }}
          src={HOTEL.imagenes.heroVideo}
          autoPlay
          muted
          loop
          playsInline
          poster={HOTEL.imagenes.hero}
        />
        {/* Gradiente cinematic — termina en forest-950 puro para fundir con la siguiente sección */}
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/75 via-forest-950/10 to-forest-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/25 via-transparent to-forest-950/25" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p
            className="text-gold-400 text-[11px] font-semibold uppercase tracking-[0.45em] mb-6 flex items-center justify-center gap-3"
            style={{ animation: "fade-in 1s ease-out 0.3s both" }}
          >
            <span className="h-px w-6 bg-gold-400/60" />
            {HOTEL.ubicacion}
            <span className="h-px w-6 bg-gold-400/60" />
          </p>
          <h1
            className="font-serif text-5xl sm:text-7xl md:text-[96px] font-bold text-white leading-[1.0] mb-6 [text-shadow:0_2px_40px_rgba(0,0,0,0.4)]"
            style={{ animation: "fade-up 1s ease-out 0.5s both" }}
          >
            {HOTEL.nombre}
          </h1>
          <p
            className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light tracking-wide"
            style={{ animation: "fade-up 1s ease-out 0.7s both" }}
          >
            {HOTEL.tagline}
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animation: "fade-up 1s ease-out 0.9s both" }}
          >
            <Link
              href="/habitaciones"
              className="btn-hero-primary"
            >
              Ver habitaciones
            </Link>
            <a
              href="#contacto"
              className="btn-hero-outline"
            >
              Consultar disponibilidad
            </a>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
          style={{ animation: "fade-in 1s ease-out 1.5s both" }}
        >
          <span className="text-[9px] uppercase tracking-[0.4em]">Explorar</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent animate-float" />
        </div>
      </section>

      {/* ── Servicios — mismo fondo que el fin del hero, sin borde ────── */}
      <section className="bg-forest-950 py-14 border-b border-forest-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {HOTEL.servicios.map((s, i) => (
              <Reveal key={s.titulo} animation="fade-up" delay={i * 80}>
                <div className="flex flex-col items-center text-center gap-2 p-4 group cursor-default">
                  <Icon name={s.icono} className="w-8 h-8 text-gold-400 transition-transform group-hover:scale-125 duration-300" />
                  <p className="font-semibold text-stone-100 text-sm">{s.titulo}</p>
                  <p className="text-xs text-stone-400 leading-relaxed">{s.descripcion}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-forest-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal animation="slide-right">
            <div>
              <SectionLabel>Sobre nosotros</SectionLabel>
              <SectionTitle>Un paraíso tropical en el corazón de Costa Rica</SectionTitle>
              <p className="mt-5 text-stone-400 leading-relaxed text-base">
                {HOTEL.descripcion}
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "12 hectáreas de bosque tropical privado",
                  "A solo 90 minutos del Aeropuerto Juan Santamaría",
                  "Certificados por el ICT con distinción 4 hojas",
                  "Más de 200 especies de aves en la propiedad",
                ].map((item, i) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-stone-300"
                    style={{ animation: `fade-up 0.5s ease-out ${300 + i * 80}ms both` }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/habitaciones"
                className="inline-flex items-center gap-2 mt-8 text-stone-300 font-semibold text-sm hover:text-gold-400 transition-colors group"
              >
                Ver todas las habitaciones
                <svg className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>

          <Reveal animation="slide-left" delay={150}>
            <div
              className="relative h-80 lg:h-[520px] rounded-3xl overflow-hidden shadow-2xl"
              style={{
                backgroundImage: `url('${HOTEL.imagenes.about}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/60 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-white/20">
                <p className="text-[10px] text-white/60 uppercase tracking-widest">Certificado</p>
                <p className="text-white font-bold text-sm mt-0.5 flex items-center gap-1">
                  Turismo Sostenible
                  {[...Array(4)].map((_, i) => <Icon key={i} name="star" className="w-3.5 h-3.5 text-gold-400" />)}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Habitaciones destacadas ───────────────────────────────────── */}
      <section className="py-24 bg-forest-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal animation="fade-up">
            <div className="text-center mb-14">
              <SectionLabel center>Hospedaje</SectionLabel>
              <SectionTitle center>Nuestras habitaciones</SectionTitle>
              <p className="mt-4 text-stone-400 max-w-xl mx-auto leading-relaxed">
                Cada espacio diseñado para conectarte con la naturaleza sin renunciar al confort.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roomTypes.slice(0, 3).map((rt: any, i: number) => (
              <Reveal key={rt.id} animation="fade-up" delay={i * 120}>
                <RoomCard rt={rt} />
              </Reveal>
            ))}
          </div>

          {roomTypes.length > 3 && (
            <Reveal animation="fade-up" delay={200}>
              <div className="text-center mt-12">
                <Link
                  href="/habitaciones"
                  className="inline-flex items-center gap-2.5 border border-forest-600/60 text-stone-300 font-semibold px-9 py-3.5 rounded-full text-sm uppercase tracking-[0.1em] transition-all duration-300 hover:bg-forest-800 hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-forest-950/40"
                >
                  Ver todas las opciones
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Planes ───────────────────────────────────────────────────── */}
      <section id="planes" className="py-24 bg-forest-950 relative overflow-hidden">
        {/* Decorative background texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal animation="fade-up">
            <div className="text-center mb-14">
              <SectionLabel center>Tarifas</SectionLabel>
              <SectionTitle center>Elige tu plan perfecto</SectionTitle>
              <p className="mt-4 text-stone-500 max-w-xl mx-auto">
                Desde hospedaje puro hasta la experiencia completa con todas las comidas y actividades.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {HOTEL.planes.map((plan, i) => (
              <Reveal key={plan.nombre} animation="fade-up" delay={i * 120}>
                <PlanCard plan={plan} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Galería ──────────────────────────────────────────────────── */}
      <section id="galeria" className="py-24 bg-forest-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal animation="fade-up">
            <div className="text-center mb-12">
              <SectionLabel>Galería</SectionLabel>
              <SectionTitle center>Descubre el paraíso</SectionTitle>
            </div>
          </Reveal>

          {/* Masonry grid: 3 cols, 4 rows. Rows 1-2: tall+vid, Row 3: three cells, Row 4: full-width video */}
          <div
            className="grid grid-cols-3 gap-3"
            style={{ gridTemplateRows: "220px 220px 220px 320px" }}
          >
            {/* img0 — tall left (rows 1-2) */}
            <Reveal animation="scale-in" delay={0} className="col-start-1 row-start-1 row-span-2">
              <GalleryPhoto src={HOTEL.imagenes.galeria[0]} className="h-full" />
            </Reveal>

            {/* img1 — top center */}
            <Reveal animation="scale-in" delay={80} className="col-start-2 row-start-1">
              <GalleryPhoto src={HOTEL.imagenes.galeria[1]} className="h-full" />
            </Reveal>

            {/* vid0 — tall right (rows 1-2) */}
            <Reveal animation="scale-in" delay={160} className="col-start-3 row-start-1 row-span-2">
              <GalleryVideo src="/videos/gallery-1.mp4" className="h-full" />
            </Reveal>

            {/* img2 — mid center */}
            <Reveal animation="scale-in" delay={120} className="col-start-2 row-start-2">
              <GalleryPhoto src={HOTEL.imagenes.galeria[2]} className="h-full" />
            </Reveal>

            {/* img3, img4, img5 — row 3 */}
            <Reveal animation="scale-in" delay={80} className="col-start-1 row-start-3">
              <GalleryPhoto src={HOTEL.imagenes.galeria[3]} className="h-full" />
            </Reveal>
            <Reveal animation="scale-in" delay={140} className="col-start-2 row-start-3">
              <GalleryPhoto src={HOTEL.imagenes.galeria[4]} className="h-full" />
            </Reveal>
            <Reveal animation="scale-in" delay={200} className="col-start-3 row-start-3">
              <GalleryPhoto src={HOTEL.imagenes.galeria[5]} className="h-full" />
            </Reveal>

            {/* vid1 — full-width cinematic bottom */}
            <Reveal animation="fade-up" delay={100} className="col-start-1 col-span-3 row-start-4">
              <GalleryVideo src="/videos/gallery-2.mp4" className="h-full" wide />
            </Reveal>
          </div>

          <Reveal animation="fade-up" delay={200}>
            <div className="text-center mt-10">
              <Link
                href="/galeria"
                className="inline-flex items-center gap-2 text-stone-400 font-semibold text-sm hover:text-gold-400 transition-colors group"
              >
                Ver galería completa
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Contacto ─────────────────────────────────────────────────── */}
      <section id="contacto" className="py-24 bg-forest-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <Reveal animation="slide-right">
            <div>
              <SectionLabel>Hablemos</SectionLabel>
              <SectionTitle>¿Tienes preguntas?</SectionTitle>
              <p className="mt-4 text-stone-400 leading-relaxed">
                Nuestro equipo está disponible para ayudarte a planificar la estadía perfecta.
                Escríbenos por WhatsApp para una respuesta inmediata.
              </p>

              <ul className="mt-8 space-y-5">
                {[
                  { icon: "location", label: "Ubicación", value: HOTEL.ubicacion },
                  { icon: "phone", label: "Teléfono", value: HOTEL.telefono, href: `tel:${HOTEL.telefono}` },
                  { icon: "email", label: "Email", value: HOTEL.email, href: `mailto:${HOTEL.email}` },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-4">
                    <Icon name={item.icon} className="w-5 h-5 mt-0.5 text-gold-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-stone-200 font-medium hover:text-gold-400 transition-colors text-sm">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-stone-200 font-medium text-sm">{item.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <a
                href={`https://wa.me/${HOTEL.whatsapp}?text=${encodeURIComponent(HOTEL.whatsappMensaje)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 mt-10 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-7 py-3.5 rounded-full transition-all shadow-md hover:scale-105"
              >
                <svg className="w-5 h-5 fill-white" viewBox="0 0 32 32">
                  <path d="M16 2C8.268 2 2 8.268 2 16c0 2.494.651 4.836 1.789 6.867L2 30l7.363-1.768A13.936 13.936 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.33 18.97c-.347-.173-2.053-1.013-2.373-1.129-.32-.116-.553-.173-.786.173-.232.347-.9 1.129-1.103 1.362-.203.232-.405.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.92-1.727-2.056-1.93-2.403-.202-.347-.021-.535.152-.707.156-.155.347-.405.52-.607.173-.203.231-.347.347-.578.115-.232.058-.434-.029-.607-.087-.173-.786-1.895-1.077-2.594-.283-.681-.571-.589-.786-.6l-.67-.011c-.232 0-.607.087-.925.434-.319.347-1.217 1.19-1.217 2.9s1.246 3.365 1.42 3.597c.173.232 2.452 3.743 5.942 5.25.831.359 1.48.573 1.986.734.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.344-1.651.29-.812.29-1.508.202-1.652-.087-.144-.319-.231-.666-.405z"/>
                </svg>
                Escribir por WhatsApp
              </a>
            </div>
          </Reveal>

          <Reveal animation="slide-left" delay={150}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function RoomCard({ rt }: { rt: any }) {
  const amenidades: string[] = rt.amenidades ?? [];

  return (
    <Link
      href={`/habitaciones/${rt.id}`}
      className="group block rounded-3xl overflow-hidden border border-forest-700/40 shadow-lg shadow-forest-950/40 hover:shadow-2xl hover:shadow-forest-950/60 transition-all duration-500 bg-forest-900 hover:-translate-y-1.5"
    >
      <div
        className="h-56 relative overflow-hidden"
        style={{
          backgroundImage: rt.imagen_url
            ? `url('${rt.imagen_url}')`
            : `linear-gradient(135deg, #1E3A27, #0d1f14)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-forest-950/0 group-hover:bg-forest-950/15 transition-colors duration-500" />
        <div className="absolute top-3 right-3 bg-forest-950/70 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold text-stone-200 border border-white/10">
          Hasta {rt.capacidad_max} personas
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-forest-900 to-transparent" />
      </div>

      <div className="p-6">
        <h3 className="font-serif text-xl font-bold text-white group-hover:text-gold-400 transition-colors leading-snug tracking-[-0.01em]">
          {rt.nombre}
        </h3>
        {rt.descripcion && (
          <p className="text-stone-400 text-[13px] mt-2 line-clamp-2 leading-[1.65] tracking-[0.01em]">{rt.descripcion}</p>
        )}

        {amenidades.slice(0, 3).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {amenidades.slice(0, 3).map((a: string) => (
              <span key={a} className="text-[11px] bg-forest-800/70 text-stone-300 border border-forest-700/50 px-2.5 py-1 rounded-full tracking-wide">
                {a}
              </span>
            ))}
            {amenidades.length > 3 && (
              <span className="text-[11px] text-stone-500 px-2 py-1">+{amenidades.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-forest-700/40">
          <div>
            <span className="text-3xl font-bold text-white tracking-tight">${Number(rt.precio_base).toFixed(0)}</span>
            <span className="text-stone-500 text-xs ml-1 tracking-wide"> / noche</span>
          </div>
          <span className="text-xs text-gold-400 font-bold uppercase tracking-[0.15em] flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver más
            <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function PlanCard({ plan }: { plan: typeof HOTEL.planes[0] }) {
  return (
    <div className={`relative rounded-3xl p-8 flex flex-col transition-all hover:-translate-y-1 duration-300 ${
      plan.destacado
        ? "bg-gold-500 text-white shadow-2xl shadow-gold-500/30 scale-105"
        : "bg-forest-900/60 text-stone-200 border border-forest-700/50 hover:border-forest-600/60"
    }`}>
      {plan.destacado && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-gold-600 text-[11px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
          Más popular
        </span>
      )}

      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${plan.destacado ? "text-white/60" : "text-stone-500"}`}>Plan</p>
      <h3 className="font-serif text-2xl font-bold mb-1">{plan.nombre}</h3>
      <p className={`text-sm mb-6 ${plan.destacado ? "text-white/75" : "text-stone-400"}`}>{plan.tagline}</p>

      {plan.precio_extra > 0 ? (
        <p className="text-4xl font-bold mb-7">
          +${plan.precio_extra}
          <span className={`text-sm font-normal ml-1 ${plan.destacado ? "text-white/60" : "text-stone-500"}`}>/persona</span>
        </p>
      ) : (
        <p className="text-4xl font-bold mb-7">Incluido</p>
      )}

      <ul className="space-y-2.5 flex-1 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.destacado ? "text-white" : "text-gold-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/habitaciones"
        className={`text-center font-bold text-sm py-3.5 rounded-full transition-all hover:scale-105 ${
          plan.destacado
            ? "bg-white text-gold-600 hover:bg-stone-50"
            : "bg-gold-500 text-white hover:bg-gold-400"
        }`}
      >
        Reservar con este plan
      </Link>
    </div>
  );
}

function GalleryPhoto({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}>
      <div
        className="absolute inset-0 bg-forest-900 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.06] group-hover:brightness-110"
        style={{ backgroundImage: `url('${src}')` }}
      />
      <div className="absolute inset-0 bg-forest-950/0 group-hover:bg-forest-950/20 transition-all duration-500 rounded-2xl" />
    </div>
  );
}

function GalleryVideo({ src, className = "", wide = false }: { src: string; className?: string; wide?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl cursor-pointer group ${className}`}>
      <video
        className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        style={{ objectFit: "cover" }}
        src={src}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute inset-0 bg-forest-950/10 group-hover:bg-forest-950/0 transition-colors duration-500" />
      {wide && (
        <div className="absolute bottom-4 left-5 flex items-center gap-2 text-white/70">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium">En vivo</span>
        </div>
      )}
    </div>
  );
}
