import { SectionHeading } from "@/components/SectionHeading";
import { posGraduacaoContent, siteContent } from "@/lib/content";

const titleColors = ["text-amet-purple", "text-amet-blue", "text-amet-indigo"] as const;

export function PosGraduacaoSection() {
  const whatsappHref = `https://wa.me/${siteContent.whatsapp.replace(/\D/g, "")}`;

  return (
    <section id="pos-graduacao" className="border-b border-amet-white/10 bg-gradient-to-br from-amet-purple to-amet-blue py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={posGraduacaoContent.title}
          subtitle={posGraduacaoContent.subtitle}
          light
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {posGraduacaoContent.programs.map((program, index) => (
            <article
              key={program.title}
              className="rounded-3xl bg-amet-white p-8 shadow-lg"
            >
              <h3 className={`text-lg font-semibold ${titleColors[index % 3]}`}>
                {program.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-amet-indigo/70">{program.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-amet-white px-6 py-3 text-sm font-semibold text-amet-purple transition hover:bg-amet-indigo hover:text-amet-white"
          >
            {posGraduacaoContent.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
