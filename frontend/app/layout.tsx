import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hotel Sol & Mar — Asistente de Reservas",
  description:
    "Reserva tu habitación en el Hotel Sol & Mar, Máncora. Consulta disponibilidad, precios y realiza tu reserva en minutos.",
  keywords: ["hotel", "Máncora", "Sol & Mar", "reservas", "habitaciones"],
  openGraph: {
    title: "Hotel Sol & Mar",
    description: "Tu descanso frente al mar. Reserva ahora.",
    type: "website",
  },
};

import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
      </head>
      <body className="h-full flex flex-col overflow-hidden">{children}</body>
    </html>
  );
}
