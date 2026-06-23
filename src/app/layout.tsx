import type { Metadata } from "next";
import localFont from "next/font/local";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

import "./globals.css";

const leagueSpartan = localFont({
  src: "../fonts/LeagueSpartan-VariableFont_wght.ttf",
  variable: "--font-league-spartan",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AMET Saúde & Estética | Venha para a AMET",
  description:
    "Instituição de ensino em saúde e estética. Conheça nossos cursos, estágios, pós-graduação e candidate-se às vagas disponíveis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${leagueSpartan.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-amet-white font-sans text-amet-indigo">
        <SiteHeader />
        {children}
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
