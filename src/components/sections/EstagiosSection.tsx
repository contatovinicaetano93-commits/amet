import Link from "next/link";

import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { estagiosContent } from "@/lib/content";

const accentColors = ["text-amet-purple", "text-amet-blue", "text-amet-indigo"] as const;
const accentBadges = ["bg-amet-purple/10", "bg-amet-blue/10", "bg-amet-indigo/10"] as const;

export function EstagiosSection() {
  return (
    <section id="estagios" className="border-b border-amet-white/10 bg-gradient-to-br from-amet-indigo to-amet-purple py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={estagiosContent.title}
          subtitle={estagiosContent.subtitle}
          light
        />

        <p className="mx-auto mb-12 max-w-3xl text-center text-base leading-7 text-amet-white/80 sm:text-lg">
          {estagiosContent.intro}
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {estagiosContent.highlights.map((item, index) => (
            <Reveal key={item.title} delay={(index % 2) * 120}>
            <article
              className="amet-card h-full rounded-3xl p-8"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${accentBadges[index % 3]} ${accentColors[index % 3]}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-amet-indigo">{item.title}</h3>
              <p className="mt-3 leading-7 text-amet-indigo/70">{item.description}</p>
            </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-center text-2xl font-bold text-amet-white">Áreas disponíveis</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {estagiosContent.areas.map((area, index) => (
              <Reveal key={area.code} delay={(index % 2) * 120}>
              <article
                className="amet-card h-full rounded-2xl p-6"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${accentBadges[index % 3]} ${accentColors[index % 3]}`}
                  >
                    {area.code}
                  </span>
                  <div>
                    <h4 className="font-semibold text-amet-indigo">{area.name}</h4>
                    <p className="mt-2 text-sm leading-6 text-amet-indigo/70">{area.description}</p>
                  </div>
                </div>
              </article>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center">
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
