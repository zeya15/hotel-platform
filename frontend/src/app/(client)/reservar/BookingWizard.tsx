"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HOTEL } from "@/lib/hotel-config";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const HOTEL_ID = Number(process.env.NEXT_PUBLIC_HOTEL_ID ?? 1);

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface WizardParams {
  room_type_id?: string;
  checkin?: string;
  checkout?: string;
  adultos?: string;
  ninos?: string;
  price?: string;
}

interface GuestInfo {
  nombre: string;
  email: string;
  telefono: string;
  notas: string;
}

type PaymentMethod = "onvo" | "sinpe" | null;

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function nights(checkin: string, checkout: string): number {
  return Math.max(
    1,
    Math.round(
      (new Date(checkout).getTime() - new Date(checkin).getTime()) / 86_400_000
    )
  );
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─── Plan pricing ──────────────────────────────────────────────────────── */

function calcTotal(
  basePrice: number,
  nightCount: number,
  plan: (typeof HOTEL.planes)[0] | null,
  adultos: number,
  ninos: number
): number {
  if (!plan) return basePrice;
  return basePrice + plan.precio_extra * adultos + plan.precio_extra * 0.5 * ninos;
}

/* ─── Wizard ────────────────────────────────────────────────────────────── */

export default function BookingWizard({ params }: { params: WizardParams }) {
  const router = useRouter();

  const roomTypeId = Number(params.room_type_id ?? 0);
  const checkin = params.checkin ?? "";
  const checkout = params.checkout ?? "";
  const adultos = Number(params.adultos ?? 2);
  const ninos = Number(params.ninos ?? 0);
  const basePrice = Number(params.price ?? 0);
  const nightCount = checkin && checkout ? nights(checkin, checkout) : 1;

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<(typeof HOTEL.planes)[0] | null>(null);
  const [guest, setGuest] = useState<GuestInfo>({ nombre: "", email: "", telefono: "", notas: "" });
  const [payMethod, setPayMethod] = useState<PaymentMethod>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = calcTotal(basePrice, nightCount, selectedPlan, adultos, ninos);

  // Guard: if no dates, send back
  if (!checkin || !checkout || !roomTypeId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-500 mb-6">Faltan datos para completar la reserva.</p>
        <Link href="/habitaciones" className="bg-forest-900 text-white font-bold px-7 py-3 rounded-full text-sm hover:bg-forest-700 transition-colors">
          Ver habitaciones
        </Link>
      </div>
    );
  }

  /* ─── Step actions ─────────────────────────────────────────────── */

  async function handleConfirm() {
    if (!payMethod) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Create guest booking
      const bookingRes = await fetch(`${API}/api/v1/bookings/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotel_id: HOTEL_ID,
          room_type_id: roomTypeId,
          plan_id: selectedPlan?.plan_id ?? null,
          check_in: checkin,
          check_out: checkout,
          adultos,
          ninos,
          nombre: guest.nombre,
          email: guest.email,
          telefono: guest.telefono || null,
          notas: guest.notas || null,
          moneda_pago: "USD",
        }),
      });

      if (!bookingRes.ok) {
        const err = await bookingRes.json().catch(() => ({}));
        throw new Error(err.detail ?? "Error al crear la reserva.");
      }

      const booking = await bookingRes.json();
      const reservationId: number = booking.id;

      // 2. Route to payment
      if (payMethod === "sinpe") {
        router.push(`/reservar/sinpe?reservation_id=${reservationId}&total=${booking.total}&moneda=${booking.moneda}`);
        return;
      }

      // ONVO
      const origin = window.location.origin;
      const onvoRes = await fetch(`${API}/api/v1/payments/onvo/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservationId,
          success_url: `${origin}/reservar/exito?reservation_id=${reservationId}`,
          cancel_url: `${origin}/reservar?room_type_id=${roomTypeId}&checkin=${checkin}&checkout=${checkout}&adultos=${adultos}&ninos=${ninos}&price=${basePrice}`,
        }),
      });

      if (!onvoRes.ok) throw new Error("Error al iniciar el pago con ONVO.");
      const { checkout_url } = await onvoRes.json();
      window.location.href = checkout_url;
    } catch (e: any) {
      setError(e.message ?? "Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  /* ─── Render ───────────────────────────────────────────────────── */

  return (
    <div className="bg-forest-950 min-h-screen">
      {/* Header */}
      <div className="bg-forest-950 border-b border-forest-800/50 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-white/60 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/habitaciones" className="hover:text-white transition-colors">Habitaciones</Link>
            <span>/</span>
            <span className="text-white">Reservar</span>
          </nav>
          <h1 className="font-serif text-3xl font-bold text-white">Completar reserva</h1>
          {/* Progress */}
          <div className="flex items-center gap-2 mt-6">
            {["Plan", "Tus datos", "Pago"].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > i + 1
                      ? "bg-gold-500 text-white"
                      : step === i + 1
                      ? "bg-white text-forest-900"
                      : "bg-white/20 text-white/50"
                  }`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-sm hidden sm:inline ${step === i + 1 ? "text-white font-semibold" : "text-white/50"}`}>
                  {label}
                </span>
                {i < 2 && <div className="w-8 h-px bg-white/20 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Plan */}
          {step === 1 && (
            <StepPlan
              selectedPlan={selectedPlan}
              onSelect={setSelectedPlan}
              adultos={adultos}
              ninos={ninos}
              basePrice={basePrice}
              nightCount={nightCount}
              onNext={() => setStep(2)}
            />
          )}

          {/* Step 2: Guest info */}
          {step === 2 && (
            <StepGuestInfo
              guest={guest}
              onChange={(field, val) => setGuest((p) => ({ ...p, [field]: val }))}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <StepPayment
              payMethod={payMethod}
              onSelect={setPayMethod}
              onBack={() => setStep(2)}
              onConfirm={handleConfirm}
              loading={loading}
              error={error}
            />
          )}
        </div>

        {/* Sidebar: booking summary */}
        <aside>
          <BookingSummary
            checkin={checkin}
            checkout={checkout}
            nightCount={nightCount}
            adultos={adultos}
            ninos={ninos}
            total={total}
            plan={selectedPlan}
          />
        </aside>
      </div>
    </div>
  );
}

/* ─── Step 1: Plan selection ─────────────────────────────────────────────── */

function StepPlan({
  selectedPlan,
  onSelect,
  adultos,
  ninos,
  basePrice,
  nightCount,
  onNext,
}: {
  selectedPlan: (typeof HOTEL.planes)[0] | null;
  onSelect: (p: (typeof HOTEL.planes)[0] | null) => void;
  adultos: number;
  ninos: number;
  basePrice: number;
  nightCount: number;
  onNext: () => void;
}) {
  return (
    <div className="bg-forest-900 rounded-3xl p-7 border border-forest-700/40">
      <h2 className="font-serif text-xl font-bold text-white mb-1">Elige tu plan</h2>
      <p className="text-stone-400 text-sm mb-6">El precio base ya incluye la habitación.</p>

      {/* No plan option */}
      <PlanOption
        label="Solo Hospedaje"
        description="Sin extras — solo la habitación"
        extra={0}
        selected={selectedPlan === null}
        onSelect={() => onSelect(null)}
        adultos={adultos}
        ninos={ninos}
        basePrice={basePrice}
        nightCount={nightCount}
      />

      {HOTEL.planes
        .filter((p) => p.precio_extra > 0)
        .map((plan) => (
          <PlanOption
            key={plan.nombre}
            label={plan.nombre}
            description={plan.tagline}
            extra={plan.precio_extra}
            selected={selectedPlan?.nombre === plan.nombre}
            onSelect={() => onSelect(plan)}
            adultos={adultos}
            ninos={ninos}
            basePrice={basePrice}
            nightCount={nightCount}
            destacado={plan.destacado}
          />
        ))}

      <button
        onClick={onNext}
        className="w-full mt-6 bg-gold-500 hover:bg-gold-400 text-white font-bold py-3 rounded-full text-sm transition-colors"
      >
        Continuar →
      </button>
    </div>
  );
}

function PlanOption({
  label,
  description,
  extra,
  selected,
  onSelect,
  adultos,
  ninos,
  basePrice,
  nightCount,
  destacado,
}: {
  label: string;
  description: string;
  extra: number;
  selected: boolean;
  onSelect: () => void;
  adultos: number;
  ninos: number;
  basePrice: number;
  nightCount: number;
  destacado?: boolean;
}) {
  const addedCost = extra * adultos + extra * 0.5 * ninos;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center justify-between gap-4 p-4 rounded-2xl border-2 mb-3 transition-all ${
        selected
          ? "border-gold-500 bg-gold-500/10"
          : "border-forest-700/50 hover:border-forest-600"
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
            selected ? "border-gold-500 bg-gold-500" : "border-forest-600"
          }`}
        >
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm flex items-center gap-2">
            {label}
            {destacado && (
              <span className="bg-gold-500 text-white text-xs px-2 py-0.5 rounded-full">Popular</span>
            )}
          </p>
          <p className="text-xs text-stone-500 truncate">{description}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {extra > 0 ? (
          <>
            <p className="font-bold text-white text-sm">+${addedCost.toFixed(0)}</p>
            <p className="text-xs text-stone-400">/estancia</p>
          </>
        ) : (
          <p className="font-bold text-stone-400 text-sm">Incluido</p>
        )}
      </div>
    </button>
  );
}

/* ─── Step 2: Guest info ────────────────────────────────────────────────── */

function StepGuestInfo({
  guest,
  onChange,
  onBack,
  onNext,
}: {
  guest: GuestInfo;
  onChange: (field: keyof GuestInfo, val: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-forest-900 rounded-3xl p-7 border border-forest-700/40">
      <h2 className="font-serif text-xl font-bold text-white mb-5">Tus datos</h2>

      <div className="space-y-4">
        <Field label="Nombre completo">
          <input
            type="text"
            value={guest.nombre}
            onChange={(e) => onChange("nombre", e.target.value)}
            placeholder="María González"
            required
            className="w-full border border-forest-700/60 bg-forest-800/60 text-white placeholder:text-stone-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
        </Field>

        <Field label="Correo electrónico">
          <input
            type="email"
            value={guest.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="maria@email.com"
            required
            className="w-full border border-forest-700/60 bg-forest-800/60 text-white placeholder:text-stone-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
        </Field>

        <Field label="Teléfono / WhatsApp (opcional)">
          <input
            type="tel"
            value={guest.telefono}
            onChange={(e) => onChange("telefono", e.target.value)}
            placeholder="+506 8888-1234"
            className="w-full border border-forest-700/60 bg-forest-800/60 text-white placeholder:text-stone-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
        </Field>

        <Field label="Peticiones especiales (opcional)">
          <textarea
            value={guest.notas}
            onChange={(e) => onChange("notas", e.target.value)}
            rows={3}
            placeholder="Cama adicional, llegada tardía, alergias alimentarias…"
            className="w-full border border-forest-700/60 bg-forest-800/60 text-white placeholder:text-stone-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 resize-none"
          />
        </Field>
      </div>

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onBack} className="flex-1 border-2 border-forest-700/50 text-stone-400 font-semibold py-3 rounded-full text-sm hover:border-forest-500 hover:text-white transition-colors">
          ← Volver
        </button>
        <button type="submit" className="flex-1 bg-gold-500 hover:bg-gold-400 text-white font-bold py-3 rounded-full text-sm transition-colors">
          Continuar →
        </button>
      </div>
    </form>
  );
}

/* ─── Step 3: Payment method ────────────────────────────────────────────── */

function StepPayment({
  payMethod,
  onSelect,
  onBack,
  onConfirm,
  loading,
  error,
}: {
  payMethod: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
  onBack: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="bg-forest-900 rounded-3xl p-7 border border-forest-700/40">
      <h2 className="font-serif text-xl font-bold text-white mb-5">Método de pago</h2>

      {/* ONVO */}
      <PayMethodOption
        value="onvo"
        selected={payMethod === "onvo"}
        onSelect={() => onSelect("onvo")}
        icon={
          <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
        label="Tarjeta de crédito / débito"
        description="Visa, Mastercard, AMEX. Pago seguro con ONVO."
      />

      {/* SINPE */}
      <PayMethodOption
        value="sinpe"
        selected={payMethod === "sinpe"}
        onSelect={() => onSelect("sinpe")}
        icon={
          <svg className="w-6 h-6 text-forest-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
        label="SINPE Móvil / Transferencia"
        description="Paga por SINPE y envía el comprobante. Confirmamos en ≤2 horas."
      />

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-700/40 rounded-2xl text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 border-2 border-forest-700/50 text-stone-400 font-semibold py-3 rounded-full text-sm hover:border-forest-500 hover:text-white transition-colors disabled:opacity-50"
        >
          ← Volver
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!payMethod || loading}
          className="flex-1 bg-gold-500 hover:bg-gold-400 text-white font-bold py-3 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              Procesando…
            </>
          ) : (
            "Confirmar reserva →"
          )}
        </button>
      </div>
    </div>
  );
}

function PayMethodOption({
  value,
  selected,
  onSelect,
  icon,
  label,
  description,
}: {
  value: string;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 mb-3 transition-all ${
        selected ? "border-gold-500 bg-gold-500/10" : "border-forest-700/50 hover:border-forest-600"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
          selected ? "border-gold-500 bg-gold-500" : "border-forest-600"
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm">{label}</p>
        <p className="text-xs text-stone-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">{icon}</div>
    </button>
  );
}

/* ─── Booking summary sidebar ────────────────────────────────────────────── */

function BookingSummary({
  checkin,
  checkout,
  nightCount,
  adultos,
  ninos,
  total,
  plan,
}: {
  checkin: string;
  checkout: string;
  nightCount: number;
  adultos: number;
  ninos: number;
  total: number;
  plan: (typeof HOTEL.planes)[0] | null;
}) {
  return (
    <div className="bg-forest-900 rounded-3xl border border-forest-700/40 p-6 sticky top-24">
      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Tu reserva</p>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-500">Check-in</span>
          <span className="font-medium text-white">{formatDate(checkin)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Check-out</span>
          <span className="font-medium text-white">{formatDate(checkout)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Noches</span>
          <span className="font-medium text-white">{nightCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Huéspedes</span>
          <span className="font-medium text-white">
            {adultos} adulto{adultos > 1 ? "s" : ""}
            {ninos > 0 ? `, ${ninos} niño${ninos > 1 ? "s" : ""}` : ""}
          </span>
        </div>
        {plan && (
          <div className="flex justify-between">
            <span className="text-stone-500">Plan</span>
            <span className="font-medium text-white">{plan.nombre}</span>
          </div>
        )}
      </div>

      <div className="border-t border-forest-700/40 mt-4 pt-4">
        <div className="flex justify-between items-end">
          <span className="text-stone-500 text-sm">Total</span>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">${total.toFixed(0)}</p>
            <p className="text-xs text-stone-400">USD</p>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {["Cancelación flexible", "Mejor precio directo", "Respuesta en ≤2h"].map((t) => (
          <li key={t} className="flex items-center gap-2 text-xs text-stone-500">
            <span className="text-gold-400">✓</span> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Generic field wrapper ─────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
