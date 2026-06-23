import { SectionHeading } from "@/components/SectionHeading";
import { praticasCursosContent } from "@/lib/content";

const cardStyles = [
  "border-amet-blue/30 bg-amet-blue/10",
  "border-amet-purple/30 bg-amet-purple/10",
  "border-amet-indigo/30 bg-amet-indigo/20",
] as const;

const bulletColors = ["before:bg-amet-blue", "before:bg-amet-purple", "before:bg-amet-white"] as const;

export function PraticasCursosSection() {
  return (
    <section id="cursos" className="border-b border-amet-white/10 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={praticasCursosContent.title}
          subtitle={praticasCursosContent.subtitle}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {praticasCursosContent.linhas.map((linha, index) => (
            <article key={linha.title} className={`rounded-3xl border p-8 ${cardStyles[index]}`}>
              <h3 className="text-xl font-semibold text-amet-white">{linha.title}</h3>
              <ul className="mt-6 space-y-3">
                {linha.items.map((item) => (
                  <li
                    key={item}
                    className={`flex gap-3 text-sm leading-6 text-amet-white/80 before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full ${bulletColors[index]}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
