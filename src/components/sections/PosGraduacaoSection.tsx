import { SectionHeading } from "@/components/SectionHeading";
import { posGraduacaoContent, siteContent } from "@/lib/content";

export function PosGraduacaoSection() {
  const whatsappHref = `https://wa.me/${siteContent.whatsapp.replace(/\D/g, "")}`;

  return (
    <section id="pos-graduacao" className="border-b border-amet-blue/10 bg-amet-blue/[0.03] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={posGraduacaoContent.title}
          subtitle={posGraduacaoContent.subtitle}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {posGraduacaoContent.programs.map((program, index) => (
            <article
              key={program.title}
              className="rounded-3xl border border-amet-blue/10 bg-amet-white p-8 shadow-sm"
            >
              <h3
                className={`text-lg font-semibold ${
                  index % 2 === 0 ? "text-amet-blue" : "text-amet-purple"
                }`}
              >
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
            className="inline-flex rounded-full border border-amet-purple bg-amet-purple/10 px-6 py-3 text-sm font-semibold text-amet-purple transition hover:bg-amet-purple hover:text-amet-white"
          >
            {posGraduacaoContent.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
