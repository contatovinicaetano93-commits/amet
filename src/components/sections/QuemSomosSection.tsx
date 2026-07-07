import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { quemSomosContent } from "@/lib/content";

export function QuemSomosSection() {
  return (
    <section id="quem-somos" className="border-b border-amet-indigo/5 bg-amet-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading title={quemSomosContent.title} />

        <Reveal className="mx-auto max-w-3xl">
        <article className="amet-card-light rounded-3xl p-8">
          <p className="text-lg font-medium leading-8 text-amet-indigo">{quemSomosContent.mission}</p>
          <p className="mt-6 leading-7 text-amet-indigo/70">{quemSomosContent.about}</p>
          <ul className="mt-8 space-y-3">
            {quemSomosContent.highlights.map((item) => (
              <li
                key={item}
                className="flex gap-3 text-sm leading-6 text-amet-indigo/70 before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-amet-purple"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>
        </Reveal>
      </div>
    </section>
  );
}
