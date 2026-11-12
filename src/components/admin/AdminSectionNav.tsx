const SECTIONS = [
  { id: "inscricoes", href: "/admin?aba=inscricoes", label: "Inscrições de estágio" },
  { id: "alunos", href: "/admin?aba=alunos", label: "Base de alunos" },
  { id: "academico", href: "/admin/academico", label: "ERP acadêmico" },
  { id: "aulas", href: "/admin/academico/aulas", label: "Aulas online" },
] as const;

export type AdminSection = (typeof SECTIONS)[number]["id"];

export function AdminSectionNav({ current }: { current: AdminSection }) {
  return (
    <div className="mt-8 flex flex-wrap gap-2 border-b border-amet-blue/15 pb-px">
      {SECTIONS.map((item) => (
        <a
          key={item.id}
          href={item.href}
          className={`rounded-t-xl px-4 py-2 text-sm font-medium ${
            current === item.id
              ? "border border-b-white border-amet-blue/15 bg-white text-amet-blue"
              : "text-amet-indigo/70 hover:text-amet-blue"
          }`}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
