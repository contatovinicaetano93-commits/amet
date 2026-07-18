import Link from "next/link";

import { BrandLogo } from "@/components/BrandLogo";
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
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[radial-gradient(circle_at_top_left,_rgba(179,85,201,0.12),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(40,90,206,0.12),_transparent_45%),var(--amet-paper)]">
      <header className="border-b border-amet-indigo/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href={user ? "/ava" : "/ava/login"} className="shrink-0">
            <BrandLogo
              markClassName="h-9 w-9"
              nameClassName="text-sm font-semibold tracking-[0.06em] text-amet-blue"
            />
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-amet-indigo/70 sm:inline">AVA</span>
            {user ? (
              <>
                {user.role === "admin" ? (
                  <Link
                    href="/ava/admin"
                    className="rounded-md px-3 py-1.5 font-medium text-amet-indigo transition hover:bg-amet-indigo/5"
                  >
                    Admin
                  </Link>
                ) : null}
                {user.role === "professor" ? (
                  <Link
                    href="/ava/professor"
                    className="rounded-md px-3 py-1.5 font-medium text-amet-indigo transition hover:bg-amet-indigo/5"
                  >
                    Painel
                  </Link>
                ) : null}
                <div className="text-right">
                  <p className="font-medium text-amet-indigo">
                    {user.name ?? user.email}
                  </p>
                  <p className="text-xs text-amet-indigo/60">
                    {roleLabel(user.role)}
                  </p>
                </div>
                <form action="/api/ava/logout" method="post">
                  <button
                    type="submit"
                    className="rounded-md border border-amet-indigo/15 px-3 py-1.5 font-medium text-amet-indigo transition hover:border-amet-indigo/30 hover:bg-white"
                  >
                    Sair
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
