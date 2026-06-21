"use client";

import { HOTEL } from "@/lib/hotel-config";

export default function WhatsAppButton() {
  const url = `https://wa.me/${HOTEL.whatsapp}?text=${encodeURIComponent(HOTEL.whatsappMensaje)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group"
    >
      {/* Tooltip */}
      <span className="hidden group-hover:flex items-center bg-white text-stone-800 text-sm font-medium px-3 py-2 rounded-xl shadow-lg whitespace-nowrap border border-stone-100 transition-all">
        ¿Necesitas ayuda?
      </span>

      {/* Bubble with pulse */}
      <span className="relative flex">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:bg-[#20bd5a] transition-colors">
          {/* WhatsApp SVG */}
          <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2C8.268 2 2 8.268 2 16c0 2.494.651 4.836 1.789 6.867L2 30l7.363-1.768A13.936 13.936 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.556 11.556 0 01-5.891-1.608l-.422-.25-4.37 1.05 1.073-4.258-.276-.437A11.548 11.548 0 014.4 16C4.4 9.59 9.59 4.4 16 4.4S27.6 9.59 27.6 16 22.41 27.6 16 27.6zm6.33-8.63c-.347-.173-2.053-1.013-2.373-1.129-.32-.116-.553-.173-.786.173-.232.347-.9 1.129-1.103 1.362-.203.232-.405.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.92-1.727-2.056-1.93-2.403-.202-.347-.021-.535.152-.707.156-.155.347-.405.52-.607.173-.203.231-.347.347-.578.115-.232.058-.434-.029-.607-.087-.173-.786-1.895-1.077-2.594-.283-.681-.571-.589-.786-.6l-.67-.011c-.232 0-.607.087-.925.434-.319.347-1.217 1.19-1.217 2.9s1.246 3.365 1.42 3.597c.173.232 2.452 3.743 5.942 5.25.831.359 1.48.573 1.986.734.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.344-1.651.29-.812.29-1.508.202-1.652-.087-.144-.319-.231-.666-.405z" />
          </svg>
        </span>
      </span>
    </a>
  );
}
