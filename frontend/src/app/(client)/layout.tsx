import WhatsAppButton from "@/components/WhatsAppButton";
import NavbarClient from "@/components/NavbarClient";
import { HOTEL } from "@/lib/hotel-config";
import Link from "next/link";

const NAV = [
  { href: "/",             label: "Inicio" },
  { href: "/habitaciones", label: "Habitaciones" },
  { href: "/galeria",      label: "Galería" },
  { href: "/#planes",      label: "Planes" },
  { href: "/#contacto",    label: "Contacto" },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-forest-950 font-sans">
      {/* ── Navigation (fixed, transparent on hero) ── */}
      <NavbarClient />

      {/* ── Content ── */}
      <main className="flex-1 pt-16">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-forest-950 text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="text-white font-serif text-lg font-bold mb-2">{HOTEL.nombre}</p>
            <p className="text-sm leading-relaxed">{HOTEL.tagline}</p>
            <div className="flex gap-4 mt-4">
              <a href={HOTEL.social.instagram} target="_blank" rel="noopener noreferrer"
                className="hover:text-gold-400 transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href={HOTEL.social.facebook} target="_blank" rel="noopener noreferrer"
                className="hover:text-gold-400 transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href={`https://wa.me/${HOTEL.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="hover:text-gold-400 transition-colors" aria-label="WhatsApp">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 32 32">
                  <path d="M16 2C8.268 2 2 8.268 2 16c0 2.494.651 4.836 1.789 6.867L2 30l7.363-1.768A13.936 13.936 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.33 18.97c-.347-.173-2.053-1.013-2.373-1.129-.32-.116-.553-.173-.786.173-.232.347-.9 1.129-1.103 1.362-.203.232-.405.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.92-1.727-2.056-1.93-2.403-.202-.347-.021-.535.152-.707.156-.155.347-.405.52-.607.173-.203.231-.347.347-.578.115-.232.058-.434-.029-.607-.087-.173-.786-1.895-1.077-2.594-.283-.681-.571-.589-.786-.6l-.67-.011c-.232 0-.607.087-.925.434-.319.347-1.217 1.19-1.217 2.9s1.246 3.365 1.42 3.597c.173.232 2.452 3.743 5.942 5.25.831.359 1.48.573 1.986.734.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.344-1.651.29-.812.29-1.508.202-1.652-.087-.144-.319-.231-.666-.405z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <p className="text-white text-sm font-semibold mb-3 uppercase tracking-widest">Navegación</p>
            <ul className="space-y-2">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm hover:text-gold-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white text-sm font-semibold mb-3 uppercase tracking-widest">Contacto</p>
            <ul className="space-y-2 text-sm">
              <li>{HOTEL.ubicacion}</li>
              <li>
                <a href={`tel:${HOTEL.telefono}`} className="hover:text-gold-400 transition-colors">
                  {HOTEL.telefono}
                </a>
              </li>
              <li>
                <a href={`mailto:${HOTEL.email}`} className="hover:text-gold-400 transition-colors">
                  {HOTEL.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-forest-800/80 py-4 text-center text-xs text-stone-600">
          © {new Date().getFullYear()} {HOTEL.nombre}. Todos los derechos reservados.
        </div>
      </footer>

      {/* WhatsApp flotante */}
      <WhatsAppButton />
    </div>
  );
}
