import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";

const leagueSpartan = localFont({
  src: "../fonts/LeagueSpartan-VariableFont_wght.ttf",
  variable: "--font-league-spartan",
  weight: "100 900",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500"],
  variable: "--font-fraunces",
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
      className={`${leagueSpartan.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-amet-paper font-sans text-amet-indigo">
        {children}
      </body>
    </html>
  );
}
