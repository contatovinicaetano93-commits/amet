import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { praticasCursosContent } from "@/lib/content";

const titleColors = ["text-amet-purple", "text-amet-blue", "text-amet-indigo"] as const;
const bulletColors = ["before:bg-amet-purple", "before:bg-amet-blue", "before:bg-amet-indigo"] as const;

export function PraticasCursosSection() {
  return (
    <section id="cursos" className="border-b border-amet-indigo/5 bg-amet-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={praticasCursosContent.title}
          subtitle={praticasCursosContent.subtitle}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {praticasCursosContent.linhas.map((linha, index) => (
            <Reveal key={linha.title} delay={index * 120}>
            <article
              className="amet-card-light h-full rounded-3xl p-8"
            >
              <h3 className={`text-xl font-semibold ${titleColors[index]}`}>{linha.title}</h3>
              <ul className="mt-6 space-y-3">
                {linha.items.map((item) => (
                  <li
                    key={item}
                    className={`flex gap-3 text-sm leading-6 text-amet-indigo/75 before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full ${bulletColors[index]}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
