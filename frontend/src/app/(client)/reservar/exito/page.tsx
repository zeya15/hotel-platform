import Link from "next/link";
import { HOTEL } from "@/lib/hotel-config";

const API = process.env.API_URL ?? "http://backend:8000";

async function getBooking(id: string) {
  try {
    const res = await fetch(`${API}/api/v1/bookings/public/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ reservation_id?: string }>;
}) {
  const sp = await searchParams;
  const booking = sp.reservation_id ? await getBooking(sp.reservation_id) : null;

  const isPendingSINPE = booking?.estado === "AWAITING_MANUAL_PAYMENT";
  const isConfirmed = booking?.estado === "CONFIRMED";

  return (
    <div className="bg-forest-950 min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full space-y-6">

        {/* Status card */}
        <div className="bg-forest-900 rounded-3xl p-8 border border-forest-700/40 text-center">
          <div className="text-6xl mb-4">{isConfirmed ? "🎉" : "⏳"}</div>
          <h1 className="font-serif text-2xl font-bold text-white mb-2">
            {isConfirmed ? "¡Reserva confirmada!" : "¡Reserva recibida!"}
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            {isConfirmed
              ? "Tu pago fue procesado exitosamente. Te enviamos un correo con los detalles."
              : isPendingSINPE
              ? "Recibimos tu comprobante de SINPE. Confirmaremos en menos de 2 horas y te notificaremos por correo."
              : "Tu reserva está siendo procesada. En breve recibirás confirmación."}
          </p>
        </div>

        {/* Booking details */}
        {booking && (
          <div className="bg-forest-900 rounded-3xl p-7 border border-forest-700/40">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">
              Detalle de reserva
            </p>
            <div className="space-y-3 text-sm">
              <Row label="Referencia" value={`#${booking.id}`} />
              <Row label="Estado">
                <StatusBadge estado={booking.estado} />
              </Row>
              <Row label="Check-in" value={formatDate(booking.check_in)} />
              <Row label="Check-out" value={formatDate(booking.check_out)} />
              <Row
                label="Huéspedes"
                value={`${booking.adultos} adulto${booking.adultos > 1 ? "s" : ""}${
                  booking.ninos > 0
                    ? `, ${booking.ninos} niño${booking.ninos > 1 ? "s" : ""}`
                    : ""
                }`}
              />
              <div className="pt-3 border-t border-forest-700/40 flex justify-between font-bold text-base">
                <span className="text-stone-400">Total</span>
                <span className="text-white">
                  ${Number(booking.total).toFixed(2)} {booking.moneda}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="bg-forest-900 rounded-3xl p-6 border border-forest-700/40 text-center">
          <p className="text-sm text-stone-400 mb-4">
            ¿Tienes preguntas sobre tu reserva? Escríbenos directamente.
          </p>
          <a
            href={`https://wa.me/${HOTEL.whatsapp}?text=${encodeURIComponent(
              `Hola! Tengo una consulta sobre mi reserva #${booking?.id ?? sp.reservation_id ?? ""} en ${HOTEL.nombre}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-6 py-3 rounded-full text-sm transition-colors"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 32 32">
              <path d="M16 2C8.268 2 2 8.268 2 16c0 2.494.651 4.836 1.789 6.867L2 30l7.363-1.768A13.936 13.936 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.33 18.97c-.347-.173-2.053-1.013-2.373-1.129-.32-.116-.553-.173-.786.173-.232.347-.9 1.129-1.103 1.362-.203.232-.405.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.92-1.727-2.056-1.93-2.403-.202-.347-.021-.535.152-.707.156-.155.347-.405.52-.607.173-.203.231-.347.347-.578.115-.232.058-.434-.029-.607-.087-.173-.786-1.895-1.077-2.594-.283-.681-.571-.589-.786-.6l-.67-.011c-.232 0-.607.087-.925.434-.319.347-1.217 1.19-1.217 2.9s1.246 3.365 1.42 3.597c.173.232 2.452 3.743 5.942 5.25.831.359 1.48.573 1.986.734.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.344-1.651.29-.812.29-1.508.202-1.652-.087-.144-.319-.231-.666-.405z"/>
            </svg>
            Contactar por WhatsApp
          </a>
        </div>

        <Link
          href="/"
          className="block text-center text-sm text-stone-500 hover:text-white transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-stone-500">{label}</span>
      {children ?? <span className="font-medium text-white text-right">{value}</span>}
    </div>
  );
}

function StatusBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    CONFIRMED: { label: "Confirmada", cls: "bg-green-900/40 text-green-400 border border-green-700/40" },
    PENDING_PAYMENT: { label: "Pago pendiente", cls: "bg-yellow-900/30 text-yellow-400 border border-yellow-700/40" },
    AWAITING_MANUAL_PAYMENT: { label: "Verificando SINPE", cls: "bg-blue-900/30 text-blue-400 border border-blue-700/40" },
  };
  const style = map[estado] ?? { label: estado, cls: "bg-forest-800 text-stone-400 border border-forest-700/40" };
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${style.cls}`}>
      {style.label}
    </span>
  );
}
