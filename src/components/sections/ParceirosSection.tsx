import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { parceirosContent } from "@/lib/content";

export function ParceirosSection() {
  return (
    <section id="parceiros" className="bg-amet-paper py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          index="07"
          eyebrow="Rede"
          title={parceirosContent.title}
          subtitle={parceirosContent.subtitle}
          accent="indigo"
        />

        <Reveal>
          <ul className="flex flex-wrap gap-3">
            {parceirosContent.parceiros.map((parceiro) => (
              <li
                key={parceiro}
                className="rounded-full border border-amet-indigo/15 px-5 py-2 text-sm font-medium text-amet-indigo/80"
              >
                {parceiro}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
