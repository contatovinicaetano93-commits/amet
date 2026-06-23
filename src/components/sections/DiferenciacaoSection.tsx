import { SectionHeading } from "@/components/SectionHeading";
import { diferenciacaoContent } from "@/lib/content";

const accentColors = ["text-amet-purple", "text-amet-blue", "text-amet-indigo", "text-amet-purple"] as const;
const accentBorders = [
  "border-amet-purple/30",
  "border-amet-blue/30",
  "border-amet-indigo/30",
  "border-amet-blue/30",
] as const;

export function DiferenciacaoSection() {
  return (
    <section id="diferenciais" className="border-b border-amet-white/10 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={diferenciacaoContent.title}
          subtitle={diferenciacaoContent.subtitle}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {diferenciacaoContent.items.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-3xl border bg-amet-white/5 p-8 transition hover:bg-amet-white/10 ${accentBorders[index]}`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-amet-white/10 text-sm font-bold ${accentColors[index]}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-amet-white">{item.title}</h3>
              <p className="mt-3 leading-7 text-amet-white/75">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
