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
    <main className="flex-1 border-b border-amet-blue/10 bg-amet-blue/[0.03] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <Link
          href="/#estagios"
          className="inline-flex items-center gap-2 text-sm font-medium text-amet-blue transition hover:text-amet-purple"
        >
          ← {estagiosInscricaoContent.backLabel}
        </Link>

        <div className="mt-8">
          <SectionHeading
            title={estagiosInscricaoContent.title}
            subtitle={estagiosInscricaoContent.subtitle}
            align="left"
          />
        </div>

        <ApplicationForm />
      </div>
    </main>
  );
}
