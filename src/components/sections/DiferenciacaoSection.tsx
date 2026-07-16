import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { diferenciacaoContent } from "@/lib/content";

export function DiferenciacaoSection() {
  return (
    <section id="diferenciais" className="border-b border-amet-indigo/8 bg-amet-paper py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          index="02"
          eyebrow="Metodologia"
          title={diferenciacaoContent.title}
          subtitle={diferenciacaoContent.subtitle}
          accent="purple"
        />

        <Reveal>
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
            {diferenciacaoContent.items.map((item, index) => (
              <div key={item.title} className="flex gap-5 border-t border-amet-indigo/10 pt-6">
                <span className="font-mono text-sm text-amet-indigo/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold text-amet-indigo">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-amet-indigo/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
