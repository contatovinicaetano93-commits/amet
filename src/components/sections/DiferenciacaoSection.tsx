import { SectionHeading } from "@/components/SectionHeading";
import { diferenciacaoContent } from "@/lib/content";

const accentColors = ["text-amet-purple", "text-amet-blue", "text-amet-indigo", "text-amet-purple"] as const;
const accentBorders = [
  "border-amet-purple/20",
  "border-amet-blue/20",
  "border-amet-indigo/20",
  "border-amet-blue/20",
] as const;

export function DiferenciacaoSection() {
  return (
    <section id="diferenciais" className="border-b border-amet-blue/10 bg-amet-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={diferenciacaoContent.title}
          subtitle={diferenciacaoContent.subtitle}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {diferenciacaoContent.items.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-3xl border bg-amet-white p-8 shadow-sm transition hover:shadow-md ${accentBorders[index]}`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-amet-blue/5 text-sm font-bold ${accentColors[index]}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-amet-indigo">{item.title}</h3>
              <p className="mt-3 leading-7 text-amet-indigo/70">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
