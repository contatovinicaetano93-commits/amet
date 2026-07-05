import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { unidadesEquipamentosContent } from "@/lib/content";

const titleColors = ["text-amet-purple", "text-amet-blue", "text-amet-white"] as const;
const bulletColors = ["before:text-amet-purple", "before:text-amet-blue", "before:text-amet-white"] as const;

export function UnidadesEquipamentosSection() {
  return (
    <section id="unidades" className="border-b border-amet-white/10 bg-gradient-to-br from-amet-blue to-amet-purple py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={unidadesEquipamentosContent.title}
          subtitle={unidadesEquipamentosContent.subtitle}
          light
        />

        <div className="mb-12 grid gap-6 lg:grid-cols-3">
          {unidadesEquipamentosContent.unidades.map((unidade, index) => (
            <Reveal key={unidade.nome} delay={index * 120}>
            <article
              className="amet-card h-full rounded-3xl p-6"
            >
              <h3 className={`text-xl font-semibold ${titleColors[index % 3]}`}>
                {unidade.nome}
              </h3>
              <p className="mt-3 text-sm leading-6 text-amet-white/75">{unidade.descricao}</p>
            </article>
            </Reveal>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {unidadesEquipamentosContent.equipamentos.map((grupo, index) => (
            <Reveal key={grupo.categoria} delay={(index % 2) * 120}>
            <article
              className="amet-card h-full rounded-3xl p-6"
            >
              <h3 className={`font-semibold ${titleColors[index % 3]}`}>{grupo.categoria}</h3>
              <ul className="mt-4 space-y-2">
                {grupo.itens.map((item) => (
                  <li
                    key={item}
                    className={`text-sm text-amet-white/80 before:mr-2 before:content-['•'] ${bulletColors[index % 3]}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
