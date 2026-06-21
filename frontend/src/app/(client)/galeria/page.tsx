import type { Metadata } from "next";
import Link from "next/link";
import { HOTEL } from "@/lib/hotel-config";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: `Galería — ${HOTEL.nombre}`,
  description: `Descubre la belleza de ${HOTEL.nombre} a través de nuestra galería de fotografías.`,
};

const CATEGORIES = [
  {
    label: "Instalaciones",
    images: HOTEL.imagenes.galeria.slice(0, 2),
  },
  {
    label: "Habitaciones",
    images: HOTEL.imagenes.galeria.slice(2, 4),
  },
  {
    label: "Naturaleza & Entorno",
    images: HOTEL.imagenes.galeria.slice(4, 6),
  },
];

const GRADIENTS = [
  "from-forest-900 to-forest-700",
  "from-forest-800 to-forest-600",
  "from-forest-950 to-forest-800",
  "from-forest-700 to-forest-900",
  "from-forest-600 to-forest-800",
  "from-forest-800 to-forest-950",
  "from-forest-900 to-forest-600",
  "from-forest-700 to-forest-800",
];

export default function GalleryPage() {
  const allImages = HOTEL.imagenes.galeria;

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="bg-forest-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gold-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">Visual</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight">
            Galería
          </h1>
          <p className="mt-4 text-stone-400 max-w-xl mx-auto text-lg">
            Un vistazo a nuestro paraíso tropical en el corazón de Costa Rica.
          </p>
          <nav className="flex items-center justify-center gap-2 mt-8 text-white/60 text-sm">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white">Galería</span>
          </nav>
        </div>
      </section>

      {/* ── Masonry hero grid ─────────────────────────────────────────── */}
      <section className="bg-forest-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Featured grid — first 3 images large */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {/* Large left */}
            <Reveal animation="fade-up">
              <GalleryCard src={allImages[0]} gradient={GRADIENTS[0]} tall />
            </Reveal>

            {/* Two stacked right */}
            <div className="flex flex-col gap-3">
              <Reveal animation="fade-up" delay={80}>
                <GalleryCard src={allImages[1]} gradient={GRADIENTS[1]} />
              </Reveal>
              <Reveal animation="fade-up" delay={160}>
                <GalleryCard src={allImages[2]} gradient={GRADIENTS[2]} />
              </Reveal>
            </div>
          </div>

          {/* Remaining images uniform grid */}
          {allImages.length > 3 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allImages.slice(3).map((src, i) => (
                <Reveal key={src} animation="scale-in" delay={i * 60}>
                  <GalleryCard src={src} gradient={GRADIENTS[(i + 3) % GRADIENTS.length]} />
                </Reveal>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-stone-500 mt-6 tracking-widest uppercase">
            {allImages.length} fotografías · {HOTEL.nombre}
          </p>
        </div>
      </section>

      {/* ── Category sections ─────────────────────────────────────────── */}
      {CATEGORIES.filter((c) => c.images.length > 0).map((cat, ci) => (
        <section key={cat.label} className={`py-16 ${ci % 2 === 0 ? "bg-forest-900/30" : "bg-forest-950"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal animation="fade-up">
              <div className="mb-8">
                <p className="text-gold-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Fotos</p>
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">{cat.label}</h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cat.images.map((src, i) => (
                <Reveal key={src} animation="fade-up" delay={i * 100}>
                  <GalleryCard
                    src={src}
                    gradient={GRADIENTS[(ci * 2 + i) % GRADIENTS.length]}
                    tall
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-forest-900 py-16 text-center">
        <p className="text-gold-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">¿Te gustó lo que viste?</p>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-6">
          Reserva tu estadía ahora
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/habitaciones"
            className="bg-gold-500 hover:bg-gold-400 text-white font-bold px-8 py-4 rounded-full text-sm uppercase tracking-widest transition-colors"
          >
            Ver habitaciones
          </Link>
          <a
            href={`https://wa.me/${HOTEL.whatsapp}?text=${encodeURIComponent(HOTEL.whatsappMensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-white/60 hover:border-white text-white font-semibold px-8 py-4 rounded-full text-sm uppercase tracking-widest transition-colors"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

/* ─── GalleryCard ────────────────────────────────────────────────────────── */

function GalleryCard({
  src,
  gradient,
  tall = false,
}: {
  src: string;
  gradient: string;
  tall?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} group cursor-zoom-in ${tall ? "aspect-[4/3]" : "aspect-square"}`}
      style={{
        backgroundImage: `url('${src}'), none`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
