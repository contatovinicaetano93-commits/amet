import { SectionHeading } from "@/components/SectionHeading";
import { StaggerReveal } from "@/components/StaggerReveal";
import { posGraduacaoContent, siteContent } from "@/lib/content";

const cardTab = ["amet-card-indigo", "amet-card-blue", "amet-card-purple"] as const;
const titleColor = ["text-amet-indigo", "text-amet-blue", "text-amet-purple"] as const;

export function PosGraduacaoSection() {
  const whatsappHref = `https://wa.me/${siteContent.whatsapp.replace(/\D/g, "")}`;

  return (
    <section id="pos-graduacao" className="border-b border-amet-indigo/8 bg-amet-paper py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          index="05"
          eyebrow="Especialização"
          title={posGraduacaoContent.title}
          subtitle={posGraduacaoContent.subtitle}
          accent="purple"
        />

        <StaggerReveal className="grid gap-6 lg:grid-cols-3">
          {posGraduacaoContent.programs.map((program, index) => (
            <article key={program.title} className={`amet-card ${cardTab[index]} h-full p-8`}>
              <h3 className={`text-lg font-semibold ${titleColor[index]}`}>
                {program.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-amet-indigo/70">{program.description}</p>
            </article>
          ))}
        </StaggerReveal>

        <div className="mt-10">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-amet-purple px-6 py-3 text-sm font-semibold text-amet-white transition hover:bg-amet-indigo"
          >
            {posGraduacaoContent.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
