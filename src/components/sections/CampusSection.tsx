import Image from "next/image";

import { SectionHeading } from "@/components/SectionHeading";
import { campusContent } from "@/lib/content";

export function CampusSection() {
  return (
    <section id="campus" className="bg-amet-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          index="—"
          eyebrow="Campus"
          title={campusContent.title}
          subtitle={campusContent.subtitle}
        />

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col items-center justify-center p-6">
            <Image
              src="/amet-logo.png"
              alt="AMET Saúde & Estética"
              width={240}
              height={260}
              className="h-auto w-full max-w-[200px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {campusContent.infos.map((info, index) => (
              <article
                key={info.title}
                className="rounded-2xl border border-amet-blue/10 bg-amet-white p-6 shadow-sm"
              >
                <h3
                  className={`font-semibold ${
                    index % 3 === 0
                      ? "text-amet-purple"
                      : index % 3 === 1
                        ? "text-amet-blue"
                        : "text-amet-indigo"
                  }`}
                >
                  {info.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-amet-indigo/70">{info.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
