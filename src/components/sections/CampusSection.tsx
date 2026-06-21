import { BrandLogo } from "@/components/BrandLogo";
import { SectionHeading } from "@/components/SectionHeading";
import { campusContent } from "@/lib/content";

export function CampusSection() {
  return (
    <section id="campus" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={campusContent.title}
          subtitle={campusContent.subtitle}
        />

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center justify-center rounded-3xl border border-amet-blue/30 bg-amet-blue/10 p-10">
            <BrandLogo showName={false} markClassName="h-36 w-36" />
            <p className="mt-6 text-center text-xl font-semibold tracking-[0.1em] text-amet-white">
              AMET Saúde & Estética
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {campusContent.infos.map((info, index) => (
              <article
                key={info.title}
                className="rounded-2xl border border-amet-white/15 bg-amet-white/5 p-6"
              >
                <h3
                  className={`font-semibold ${
                    index % 3 === 0
                      ? "text-amet-purple"
                      : index % 3 === 1
                        ? "text-amet-blue"
                        : "text-amet-white"
                  }`}
                >
                  {info.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-amet-white/75">{info.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
