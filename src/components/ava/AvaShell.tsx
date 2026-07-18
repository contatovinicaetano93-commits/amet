import Link from "next/link";

import { AmetMark } from "@/components/AmetMark";
import { homePathForRole } from "@/lib/ava/navigation";
import { roleLabel } from "@/lib/ava/permissions";
import type { UserRole } from "@/lib/ava/schema";

type AvaShellProps = {
  children: React.ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    role: UserRole;
  } | null;
};

export function AvaShell({ children, user }: AvaShellProps) {
  const homeHref = user ? homePathForRole(user.role) : "/ava/login";

  return (
    <div className="ava-shell flex min-h-full flex-1 flex-col">
      <header className="border-b border-[var(--ava-line)] bg-[color-mix(in_srgb,#ffffff_72%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href={homeHref} className="group flex items-center gap-3">
            <AmetMark className="h-9 w-9 transition duration-300 group-hover:scale-[1.03]" />
            <span className="flex flex-col leading-none">
              <span className="ava-display text-[1.35rem] text-amet-indigo">
                AMET
              </span>
              <span className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--ava-muted)]">
                AVA
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-sm sm:gap-3">
            {user ? (
              <>
                {user.role === "admin" ? (
                  <Link
                    href="/ava/admin"
                    className="hidden rounded-sm px-3 py-1.5 font-medium text-amet-indigo/80 transition hover:bg-white/70 hover:text-amet-indigo sm:inline-flex"
                  >
                    Admin
                  </Link>
                ) : null}
                {user.role === "professor" ? (
                  <Link
                    href="/ava/professor"
                    className="hidden rounded-sm px-3 py-1.5 font-medium text-amet-indigo/80 transition hover:bg-white/70 hover:text-amet-indigo sm:inline-flex"
                  >
                    Professor
                  </Link>
                ) : null}
                {user.role === "aluno" ? (
                  <Link
                    href="/ava"
                    className="hidden rounded-sm px-3 py-1.5 font-medium text-amet-indigo/80 transition hover:bg-white/70 hover:text-amet-indigo sm:inline-flex"
                  >
                    Turmas
                  </Link>
                ) : null}
                <div className="hidden text-right sm:block">
                  <p className="font-medium text-amet-indigo">
                    {user.name ?? user.email}
                  </p>
                  <p className="text-[0.7rem] uppercase tracking-[0.14em] text-[var(--ava-muted)]">
                    {roleLabel(user.role)}
                  </p>
                </div>
                <form action="/api/ava/logout" method="post">
                  <button type="submit" className="ava-btn ava-btn-ghost px-3 py-1.5">
                    Sair
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
