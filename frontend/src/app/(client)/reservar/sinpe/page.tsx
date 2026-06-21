"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { HOTEL } from "@/lib/hotel-config";
import { Suspense } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ─── SINPE account details (edit per hotel) ─────────────────────────────── */
const SINPE = {
  numero: "50625561234",
  nombre: "Hotel Paraíso Verde S.A.",
  banco: "Banco Nacional de Costa Rica",
};

function SINPEContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const reservationId = sp.get("reservation_id") ?? "";
  const total = sp.get("total") ?? "0";
  const moneda = sp.get("moneda") ?? "USD";

  const [referencia, setReferencia] = useState("");
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function copyNumber() {
    navigator.clipboard.writeText(SINPE.numero);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!referencia.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/payments/sinpe/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: Number(reservationId),
          referencia: referencia.trim(),
          comprobante_url: comprobanteUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Error al enviar el comprobante.");
      }
      router.push(`/reservar/exito?reservation_id=${reservationId}`);
    } catch (e: any) {
      setError(e.message ?? "Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-forest-950 min-h-screen">
      {/* Header */}
      <div className="bg-forest-950 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-white/60 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/habitaciones" className="hover:text-white transition-colors">Habitaciones</Link>
            <span>/</span>
            <span className="text-white">Pago SINPE</span>
          </nav>
          <h1 className="font-serif text-3xl font-bold text-white">Instrucciones de pago</h1>
          <p className="text-stone-400 mt-2 text-sm">Reserva #{reservationId}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Amount */}
        <div className="bg-forest-900 rounded-3xl p-7 border border-forest-700/40">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Monto a transferir</p>
          <p className="text-4xl font-bold text-white">${Number(total).toFixed(2)} <span className="text-stone-400 text-xl font-normal">{moneda}</span></p>
          <p className="text-sm text-stone-400 mt-2">
            Incluye todos los cargos. No hay costos adicionales.
          </p>
        </div>

        {/* SINPE details */}
        <div className="bg-forest-900 rounded-3xl p-7 border border-forest-700/40">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-5">Datos SINPE Móvil</p>

          <div className="space-y-4">
            {/* Phone number */}
            <div className="flex items-center justify-between p-4 bg-forest-800/50 rounded-2xl">
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Número SINPE</p>
                <p className="font-bold text-white text-xl tracking-wider">{SINPE.numero}</p>
              </div>
              <button
                onClick={copyNumber}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-colors ${
                  copied
                    ? "bg-forest-700 text-gold-400"
                    : "bg-gold-500 text-white hover:bg-gold-400"
                }`}
              >
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-stone-500 text-xs mb-0.5">Nombre</p>
                <p className="font-medium text-white">{SINPE.nombre}</p>
              </div>
              <div>
                <p className="text-stone-500 text-xs mb-0.5">Banco</p>
                <p className="font-medium text-white">{SINPE.banco}</p>
              </div>
            </div>

            <div className="p-4 bg-gold-500/10 border border-gold-400/30 rounded-2xl text-sm text-stone-300">
              <strong>Referencia:</strong> coloca el número de reserva <strong>#{reservationId}</strong> en el mensaje del SINPE para que podamos identificar tu pago.
            </div>
          </div>
        </div>

        {/* Submit comprobante */}
        <form onSubmit={handleSubmit} className="bg-forest-900 rounded-3xl p-7 border border-forest-700/40">
          <h2 className="font-serif text-xl font-bold text-white mb-1">Confirmar pago</h2>
          <p className="text-stone-400 text-sm mb-5">
            Una vez que hagas el SINPE, ingresa el número de confirmación. Verificaremos y confirmaremos en menos de 2 horas.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">
                Número de confirmación SINPE *
              </label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: 240523001234"
                required
                className="w-full border border-forest-700/60 bg-forest-800/60 text-white placeholder:text-stone-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">
                URL del comprobante (opcional)
              </label>
              <input
                type="url"
                value={comprobanteUrl}
                onChange={(e) => setComprobanteUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full border border-forest-700/60 bg-forest-800/60 text-white placeholder:text-stone-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
              <p className="text-xs text-stone-400 mt-1">Sube la foto del comprobante a Google Drive o similar y pega el enlace.</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700/40 rounded-2xl text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !referencia.trim()}
            className="w-full mt-6 bg-gold-500 hover:bg-gold-400 text-white font-bold py-3 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Enviando…
              </>
            ) : (
              "Enviar comprobante y confirmar"
            )}
          </button>
        </form>

        {/* WhatsApp fallback */}
        <div className="text-center">
          <p className="text-sm text-stone-400 mb-3">¿Preferís enviarlo por WhatsApp?</p>
          <a
            href={`https://wa.me/${HOTEL.whatsapp}?text=${encodeURIComponent(`Hola! Hice un SINPE para la reserva #${reservationId} por $${total} ${moneda}. Mi comprobante es:`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 rounded-full text-sm transition-colors"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 32 32">
              <path d="M16 2C8.268 2 2 8.268 2 16c0 2.494.651 4.836 1.789 6.867L2 30l7.363-1.768A13.936 13.936 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.33 18.97c-.347-.173-2.053-1.013-2.373-1.129-.32-.116-.553-.173-.786.173-.232.347-.9 1.129-1.103 1.362-.203.232-.405.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.92-1.727-2.056-1.93-2.403-.202-.347-.021-.535.152-.707.156-.155.347-.405.52-.607.173-.203.231-.347.347-.578.115-.232.058-.434-.029-.607-.087-.173-.786-1.895-1.077-2.594-.283-.681-.571-.589-.786-.6l-.67-.011c-.232 0-.607.087-.925.434-.319.347-1.217 1.19-1.217 2.9s1.246 3.365 1.42 3.597c.173.232 2.452 3.743 5.942 5.25.831.359 1.48.573 1.986.734.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.344-1.651.29-.812.29-1.508.202-1.652-.087-.144-.319-.231-.666-.405z"/>
            </svg>
            Enviar comprobante por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SINPEPage() {
  return (
    <Suspense>
      <SINPEContent />
    </Suspense>
  );
}
