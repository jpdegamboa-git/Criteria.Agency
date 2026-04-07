import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "criteria.agency — Video profesional con IA. Con criterio.",
  description:
    "Producimos video profesional potenciado con IA para marcas que necesitan escalar contenido sin perder calidad ni criterio creativo.",
  openGraph: {
    title: "criteria.agency — Video profesional con IA. Con criterio.",
    description:
      "Producimos video profesional potenciado con IA para marcas que necesitan escalar contenido sin perder calidad ni criterio creativo.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="font-sans bg-surface-bg antialiased min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
