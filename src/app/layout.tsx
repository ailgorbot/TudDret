import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "TudDret — Carnet de voyage au Cap-Vert",
  description:
    "Planificateur de voyage au Cap-Vert : itinéraire jour par jour, activités, budget et météo des îles.",
};

export const viewport: Viewport = {
  themeColor: "#003893",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="flag-ribbon" aria-hidden="true" />
        {children}
        <footer className="mt-auto flex flex-col items-center gap-2 border-t border-sand-200 bg-sand-100 px-4 py-8 text-sm text-ocean-900">
          <span className="font-display text-base italic">Feito com morabeza</span>
          <span aria-hidden="true" className="tracking-[0.4em] text-star-500">
            ★★★★★★★★★★
          </span>
          <span className="text-ocean-900/70">Cap-Vert · 2026</span>
        </footer>
      </body>
    </html>
  );
}
