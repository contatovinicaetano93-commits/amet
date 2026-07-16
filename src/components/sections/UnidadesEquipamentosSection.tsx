import { GalleryLightbox } from "@/components/GalleryLightbox";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { unidadesEquipamentosContent } from "@/lib/content";

const equipTab = ["amet-card-blue", "amet-card-indigo", "amet-card-purple", ""] as const;

export function UnidadesEquipamentosSection() {
  return (
    <section id="unidades" className="border-b border-amet-indigo/8 bg-amet-paper py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          index="06"
          eyebrow="Estrutura"
          title={unidadesEquipamentosContent.title}
          subtitle={unidadesEquipamentosContent.subtitle}
          accent="blue"
        />

        <div className="mb-10 grid gap-6 lg:grid-cols-3">
          {unidadesEquipamentosContent.unidades.map((unidade) => (
            <Reveal key={unidade.nome}>
              <article className="amet-card h-full p-6">
                <h3 className="text-xl font-semibold text-amet-indigo">{unidade.nome}</h3>
                <p className="mt-3 text-sm leading-6 text-amet-indigo/70">{unidade.descricao}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {unidadesEquipamentosContent.equipamentos.map((grupo, index) => (
            <Reveal key={grupo.categoria}>
              <article className={`amet-card ${equipTab[index]} h-full p-6`}>
                <h3 className="font-semibold text-amet-indigo">{grupo.categoria}</h3>
                <ul className="mt-4 space-y-2">
                  {grupo.itens.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-amet-indigo/75">
                      <span className="text-amet-indigo/30">–</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amet-indigo/45">
            Espaços em prática
          </p>
          <div className="mt-6">
            <GalleryLightbox />
          </div>
        </div>
      </div>
    </section>
  );
}
