import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminSectionNav, type AdminSection } from "@/components/admin/AdminSectionNav";

const fieldClass =
  "mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-2.5 text-sm text-amet-indigo outline-none focus:border-amet-blue";

export const academicoFieldClass = fieldClass;

export function AcademicoChrome({
  title,
  description,
  action,
  section = "academico",
  ok,
  erro,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  section?: Extract<AdminSection, "academico" | "aulas">;
  ok?: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-amet-blue uppercase">Painel administrativo</p>
          <h1 className="mt-1 text-2xl font-bold text-amet-indigo">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-amet-indigo/70">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {action}
          <AdminLogoutButton />
        </div>
      </div>
      <AdminSectionNav current={section} />
      {erro ? <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p> : null}
      {ok ? <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{ok}</p> : null}
      <div className="mt-8">{children}</div>
    </main>
  );
}

export function AcademicoCard({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl border border-amet-blue/15 bg-white p-5">{children}</section>;
}
