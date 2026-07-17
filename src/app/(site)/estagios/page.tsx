import type { Metadata } from "next";
import Link from "next/link";

import { ApplicationForm } from "@/components/ApplicationForm";
import { SectionHeading } from "@/components/SectionHeading";
import { estagiosInscricaoContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Inscrição Estágios 2027 | AMET Saúde & Estética",
  description:
    "Candidate-se ao programa de estágios da AMET Saúde & Estética. Vagas limitadas para 2027.",
};

export default function EstagiosInscricaoPage() {
  return (
    <main className="flex-1 border-b border-amet-indigo/8 bg-amet-paper py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <Link
          href="/#estagios"
          className="inline-flex items-center gap-2 text-sm font-medium text-amet-blue transition hover:text-amet-purple"
        >
          ← {estagiosInscricaoContent.backLabel}
        </Link>

        <div className="mt-8">
          <SectionHeading
            index="04"
            eyebrow="Residência Clínica"
            title={estagiosInscricaoContent.title}
            subtitle={estagiosInscricaoContent.subtitle}
          />
        </div>

        <ApplicationForm />
      </div>
    </main>
  );
}
