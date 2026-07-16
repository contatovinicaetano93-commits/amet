import { SectionHeading } from "@/components/SectionHeading";
import { StaggerReveal } from "@/components/StaggerReveal";
import { praticasCursosContent } from "@/lib/content";

const cardTab = ["amet-card-indigo", "amet-card-blue", "amet-card-purple"] as const;
const titleColor = ["text-amet-indigo", "text-amet-blue", "text-amet-purple"] as const;

export function PraticasCursosSection() {
  return (
    <section id="cursos" className="border-b border-amet-indigo/8 bg-amet-paper py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          index="03"
          eyebrow="Formação"
          title={praticasCursosContent.title}
          subtitle={praticasCursosContent.subtitle}
          accent="blue"
        />

        <StaggerReveal className="grid gap-6 lg:grid-cols-3">
          {praticasCursosContent.linhas.map((linha, index) => (
            <article key={linha.title} className={`amet-card ${cardTab[index]} h-full p-8`}>
              <h3 className={`text-xl font-semibold ${titleColor[index]}`}>{linha.title}</h3>
              <ul className="mt-6 space-y-3">
                {linha.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-amet-indigo/75">
                    <span className="text-amet-indigo/30">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
