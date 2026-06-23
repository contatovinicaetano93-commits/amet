import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { siteContent } from "@/lib/content";

import "./globals.css";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-league-spartan",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AMET Saúde & Estética | Venha para a AMET",
  description:
    "Instituição de ensino em saúde e estética. Conheça nossos cursos, estágios, pós-graduação e candidate-se às vagas disponíveis.",
  icons: { icon: "/amet-mark.png", apple: "/amet-mark.png" },
  openGraph: {
    title: "AMET Saúde & Estética",
    description: siteContent.tagline,
    locale: "pt_BR",
    type: "website",
  },
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
      <body className="min-h-full flex flex-col bg-amet-indigo font-sans text-amet-white">
        <SiteHeader />
        {children}
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
