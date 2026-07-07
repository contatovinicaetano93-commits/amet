import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { parceirosContent } from "@/lib/content";

export function ParceirosSection() {
  return (
    <section id="parceiros" className="border-b border-amet-indigo/5 bg-amet-purple/[0.04] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading title={parceirosContent.title} subtitle={parceirosContent.subtitle} />

        <Reveal>
        <ul className="flex flex-wrap justify-center gap-4">
          {parceirosContent.parceiros.map((parceiro, index) => (
            <li
              key={parceiro}
              className={`amet-card-light rounded-full px-6 py-3 text-sm font-semibold ${
                index % 3 === 0
                  ? "text-amet-purple"
                  : index % 3 === 1
                    ? "text-amet-blue"
                    : "text-amet-indigo"
              }`}
            >
              {parceiro}
            </li>
          ))}
        </ul>
        </Reveal>
      </div>
    </section>
  );
}
