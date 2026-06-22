import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Base para resolver URLs relativas en metadatos (og:image, twitter:image, etc.).
// Sin esto, Next.js usa http://localhost:3000 por defecto y los previews al
// compartir el link no cargan. Configurable por SITE_URL en producción.
const SITE_URL = process.env.SITE_URL ?? "https://hotel.217-216-87-116.nip.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: "%s — Hotel Paraíso Verde", default: "Hotel Paraíso Verde" },
  description: "Tu refugio en el corazón de Costa Rica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
