"use client";

import { useState } from "react";
import { HOTEL } from "@/lib/hotel-config";

interface FormState {
  nombre: string;
  email: string;
  checkin: string;
  checkout: string;
  mensaje: string;
}

const inputClass =
  "w-full border border-forest-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 bg-forest-800/60 text-white placeholder:text-stone-500 transition-colors";

const labelClass =
  "block text-[10px] font-semibold text-stone-500 uppercase tracking-widest mb-1.5";

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    nombre: "",
    email: "",
    checkin: "",
    checkout: "",
    mensaje: "",
  });
  const [sent, setSent] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const lines: string[] = [`Hola! Soy ${form.nombre} (${form.email}).`];
    if (form.checkin && form.checkout) {
      lines.push(`Me interesa reservar del ${form.checkin} al ${form.checkout}.`);
    }
    if (form.mensaje.trim()) {
      lines.push(form.mensaje.trim());
    }

    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${HOTEL.whatsapp}?text=${text}`, "_blank");
    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-forest-900/60 rounded-3xl p-8 border border-forest-700/50 flex flex-col items-center justify-center gap-4 min-h-[320px] text-center">
        <span className="text-5xl">✅</span>
        <h3 className="font-serif text-xl font-bold text-white">
          ¡Te redirigimos a WhatsApp!
        </h3>
        <p className="text-stone-400 text-sm max-w-xs">
          Si no se abrió automáticamente, escríbenos directo al{" "}
          <a
            href={`https://wa.me/${HOTEL.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 font-semibold underline"
          >
            {HOTEL.telefono}
          </a>
          .
        </p>
        <button
          onClick={() => setSent(false)}
          className="mt-2 text-xs text-stone-500 hover:text-stone-300 underline transition-colors"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-forest-900/60 rounded-3xl p-8 space-y-4 border border-forest-700/50"
    >
      <h3 className="font-serif text-xl font-bold text-white">
        Envíanos un mensaje
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Check-in</label>
          <input
            type="date"
            name="checkin"
            value={form.checkin}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Check-out</label>
          <input
            type="date"
            name="checkout"
            value={form.checkout}
            onChange={handleChange}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Mensaje</label>
        <textarea
          name="mensaje"
          value={form.mensaje}
          onChange={handleChange}
          rows={4}
          placeholder="¿En qué podemos ayudarte?"
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gold-500 hover:bg-gold-400 text-white font-bold py-3.5 rounded-full text-sm uppercase tracking-widest transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-gold-500/30"
      >
        Enviar por WhatsApp
      </button>
      <p className="text-center text-xs text-stone-500">
        Te responderemos en menos de 2 horas en horario de oficina.
      </p>
    </form>
  );
}
