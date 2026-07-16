import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { quemSomosContent } from "@/lib/content";

export function QuemSomosSection() {
  return (
    <section id="quem-somos" className="border-b border-amet-indigo/8 bg-amet-paper py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading index="01" eyebrow="Instituição" title={quemSomosContent.title} accent="indigo" />

        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <blockquote className="border-l-2 border-amet-purple pl-6">
              <p className="font-editorial text-2xl italic leading-snug text-amet-indigo sm:text-3xl">
                {quemSomosContent.mission}
              </p>
            </blockquote>

            <div>
              <p className="leading-7 text-amet-indigo/75">{quemSomosContent.about}</p>
              <ul className="mt-8 space-y-3 border-t border-amet-indigo/10 pt-6">
                {quemSomosContent.highlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-amet-indigo/75">
                    <span className="mt-0.5 shrink-0 text-amet-purple">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
