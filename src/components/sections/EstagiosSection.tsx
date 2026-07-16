import Link from "next/link";

import { SectionHeading } from "@/components/SectionHeading";
import { StaggerReveal } from "@/components/StaggerReveal";
import { estagiosContent } from "@/lib/content";

const highlightTab = ["amet-card-purple", "amet-card-blue", "amet-card-indigo"] as const;

const areaTab: Record<string, (typeof highlightTab)[number]> = {
  IMG: "amet-card-indigo",
  AC: "amet-card-blue",
  EST: "amet-card-purple",
};

export function EstagiosSection() {
  return (
    <section id="estagios" className="border-b border-amet-white/10 bg-amet-indigo py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          index="04"
          eyebrow="Residência Clínica"
          title={estagiosContent.title}
          subtitle={estagiosContent.subtitle}
          light
        />

        <p className="max-w-2xl text-base leading-7 text-amet-white/70">
          {estagiosContent.intro}
        </p>

        <StaggerReveal className="mt-12 grid gap-4 sm:grid-cols-2">
          {estagiosContent.highlights.map((item, index) => (
            <article key={item.title} className={`amet-card-onDark ${highlightTab[index % 3]} h-full p-6`}>
              <span className="font-mono text-xs font-semibold text-amet-indigo/40">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-amet-indigo">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-amet-indigo/70">{item.description}</p>
            </article>
          ))}
        </StaggerReveal>

        <div className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amet-white/45">
            Áreas disponíveis
          </p>
          <StaggerReveal className="mt-6 grid gap-4 sm:grid-cols-3">
            {estagiosContent.areas.map((area) => (
              <article key={area.code} className={`amet-card-onDark ${areaTab[area.code]} h-full p-6`}>
                <span className="font-mono text-xs font-semibold tracking-wider text-amet-indigo/40">
                  {area.code}
                </span>
                <h4 className="mt-2 font-semibold text-amet-indigo">{area.name}</h4>
                <p className="mt-2 text-sm leading-6 text-amet-indigo/70">{area.description}</p>
              </article>
            ))}
          </StaggerReveal>
        </div>

        <div className="mt-16">
          <Link
            href={estagiosContent.ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-amet-white px-8 py-4 text-base font-semibold text-amet-indigo transition hover:bg-amet-purple hover:text-amet-white"
          >
            {estagiosContent.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
