import type { Metadata } from "next";

import { ApplicationForm } from "@/components/ApplicationForm";
import { SectionHeading } from "@/components/SectionHeading";
import { estagiosInscricaoContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Inscrição Estágios 2026 | AMET Saúde & Estética",
  description:
    "Candidate-se ao programa de estágios da AMET Saúde & Estética. Vagas limitadas para 2026.",
};

export default function EstagiosInscricaoPage() {
  return (
    <main className="flex-1 border-b border-amet-indigo/8 bg-amet-paper py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading
          index="04"
          eyebrow="Residência Clínica"
          title={estagiosInscricaoContent.title}
          subtitle={estagiosInscricaoContent.subtitle}
        />

        <ApplicationForm />
      </div>
    </main>
  );
}
