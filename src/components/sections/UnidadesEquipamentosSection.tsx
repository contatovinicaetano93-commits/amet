import { SectionHeading } from "@/components/SectionHeading";
import { unidadesEquipamentosContent } from "@/lib/content";

export function UnidadesEquipamentosSection() {
  return (
    <section id="unidades" className="border-b border-amet-blue/10 bg-amet-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          title={unidadesEquipamentosContent.title}
          subtitle={unidadesEquipamentosContent.subtitle}
        />

        <div className="mb-12 grid gap-6 lg:grid-cols-3">
          {unidadesEquipamentosContent.unidades.map((unidade, index) => (
            <article
              key={unidade.nome}
              className="rounded-3xl border border-amet-blue/15 bg-amet-white p-6 shadow-sm"
            >
              <h3
                className={`text-xl font-semibold ${
                  index === 0 ? "text-amet-purple" : index === 1 ? "text-amet-blue" : "text-amet-indigo"
                }`}
              >
                {unidade.nome}
              </h3>
              <p className="mt-3 text-sm leading-6 text-amet-indigo/70">{unidade.descricao}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {unidadesEquipamentosContent.equipamentos.map((grupo) => (
            <article
              key={grupo.categoria}
              className="rounded-3xl border border-amet-purple/15 bg-amet-purple/[0.03] p-6"
            >
              <h3 className="font-semibold text-amet-purple">{grupo.categoria}</h3>
              <ul className="mt-4 space-y-2">
                {grupo.itens.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-amet-indigo/75 before:mr-2 before:text-amet-blue before:content-['•']"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-amet-indigo/50">
          {unidadesEquipamentosContent.notaAtualizacao}
        </p>
      </div>
    </section>
  );
}
