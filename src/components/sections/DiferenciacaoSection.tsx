import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { diferenciacaoContent } from "@/lib/content";

const accentColors = ["text-amet-purple", "text-amet-blue", "text-amet-white"] as const;
const accentBadges = ["bg-amet-purple/20", "bg-amet-blue/20", "bg-amet-white/15"] as const;

export function DiferenciacaoSection() {
  return (
    <section id="diferenciais" className="border-b border-amet-white/10 bg-gradient-to-br from-amet-purple to-amet-indigo py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={diferenciacaoContent.title}
          subtitle={diferenciacaoContent.subtitle}
          light
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {diferenciacaoContent.items.map((item, index) => (
            <Reveal key={item.title} delay={(index % 2) * 120}>
            <article
              className="amet-card h-full rounded-3xl p-8"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${accentBadges[index % 3]} ${accentColors[index % 3]}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-amet-white">{item.title}</h3>
              <p className="mt-3 leading-7 text-amet-white/75">{item.description}</p>
            </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
