import Link from "next/link";

import { SectionHeading } from "@/components/SectionHeading";
import { estagiosContent } from "@/lib/content";

const accentColors = ["text-amet-purple", "text-amet-blue", "text-amet-indigo", "text-amet-purple"] as const;
const accentBorders = [
  "border-amet-purple/20",
  "border-amet-blue/20",
  "border-amet-indigo/20",
  "border-amet-blue/20",
] as const;

export function EstagiosSection() {
  return (
    <section id="estagios" className="border-b border-amet-blue/10 bg-amet-blue/[0.03] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={estagiosContent.title}
          subtitle={estagiosContent.subtitle}
        />

        <p className="mx-auto mb-12 max-w-3xl text-center text-base leading-7 text-amet-indigo/75 sm:text-lg">
          {estagiosContent.intro}
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {estagiosContent.highlights.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-3xl border bg-amet-white p-8 shadow-sm ${accentBorders[index]}`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-amet-blue/5 text-sm font-bold ${accentColors[index]}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-amet-indigo">{item.title}</h3>
              <p className="mt-3 leading-7 text-amet-indigo/70">{item.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-center text-2xl font-bold text-amet-indigo">Áreas disponíveis</h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {estagiosContent.areas.map((area, index) => (
              <article
                key={area.code}
                className="rounded-2xl border border-amet-blue/10 bg-amet-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amet-blue/5 text-xs font-bold ${
                      index % 2 === 0 ? "text-amet-blue" : "text-amet-purple"
                    }`}
                  >
                    {area.code}
                  </span>
                  <div>
                    <h4 className="font-semibold text-amet-indigo">{area.name}</h4>
                    <p className="mt-2 text-sm leading-6 text-amet-indigo/70">{area.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center">
          <Link
            href={estagiosContent.ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-amet-blue px-8 py-4 text-base font-semibold text-amet-white transition hover:bg-amet-indigo"
          >
            {estagiosContent.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
