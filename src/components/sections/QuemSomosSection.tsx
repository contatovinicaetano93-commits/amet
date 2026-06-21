import { SectionHeading } from "@/components/SectionHeading";
import { quemSomosContent } from "@/lib/content";

export function QuemSomosSection() {
  return (
    <section id="quem-somos" className="border-b border-amet-white/10 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading title={quemSomosContent.title} />

        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-amet-blue/30 bg-amet-blue/10 p-8">
            <h3 className="text-xl font-semibold text-amet-blue">
              {quemSomosContent.missionTitle}
            </h3>
            <p className="mt-4 leading-7 text-amet-white/80">{quemSomosContent.mission}</p>
          </article>

          <article className="rounded-3xl border border-amet-purple/30 bg-amet-purple/10 p-8">
            <h3 className="text-xl font-semibold text-amet-purple">
              {quemSomosContent.aboutTitle}
            </h3>
            <p className="mt-4 leading-7 text-amet-white/80">{quemSomosContent.about}</p>
            <ul className="mt-6 space-y-3">
              {quemSomosContent.highlights.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-6 text-amet-white/75 before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-amet-blue"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
