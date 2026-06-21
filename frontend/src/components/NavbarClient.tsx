"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HOTEL } from "@/lib/hotel-config";

const NAV = [
  { href: "/",             label: "Inicio" },
  { href: "/habitaciones", label: "Habitaciones" },
  { href: "/galeria",      label: "Galería" },
  { href: "/#planes",      label: "Planes" },
  { href: "/#contacto",    label: "Contacto" },
];

export default function NavbarClient() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-forest-950/95 backdrop-blur-md border-b border-forest-800/70 shadow-lg shadow-forest-950/50"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span
            className={`font-serif text-xl font-bold tracking-tight leading-none transition-colors duration-500 ${
              scrolled ? "text-white" : "text-white drop-shadow-sm"
            }`}
          >
            {HOTEL.nombre}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors duration-300 ${
                scrolled
                  ? "text-stone-400 hover:text-white"
                  : "text-white/85 hover:text-white drop-shadow-sm"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/habitaciones"
            className={`ml-2 text-sm font-semibold px-5 py-2 rounded-full transition-all duration-300 ${
              scrolled
                ? "bg-gold-500 text-white hover:bg-gold-400"
                : "bg-white/15 text-white border border-white/50 hover:bg-white/25 backdrop-blur-sm"
            }`}
          >
            Reservar ahora
          </Link>
        </nav>

        <details className="md:hidden relative">
          <summary
            className={`list-none cursor-pointer p-2 rounded-lg transition-colors ${
              scrolled ? "text-stone-300 hover:bg-forest-800/60" : "text-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <nav className="absolute right-0 top-10 bg-forest-900 rounded-2xl shadow-xl border border-forest-700/60 p-4 w-52 flex flex-col gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-stone-300 hover:text-white font-medium px-3 py-2 rounded-lg hover:bg-forest-800/60 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/habitaciones"
              className="mt-1 bg-gold-500 text-white text-sm font-semibold px-4 py-2 rounded-full text-center hover:bg-gold-400 transition-colors"
            >
              Reservar
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
