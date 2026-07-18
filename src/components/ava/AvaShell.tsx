import Link from "next/link";

import { AmetMark } from "@/components/AmetMark";
import { AvaSidebarNav } from "@/components/ava/AvaSidebarNav";
import {
  navItemsForRole,
  panelHome,
  panelTitleForRole,
} from "@/lib/ava/nav";
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
  const homeHref = user ? panelHome(user.role) : "/ava/login";

  if (!user) {
    return (
      <div className="ava-app ava-app-public">
        <header className="ava-public-top">
          <Link href={homeHref} className="ava-brand">
            <AmetMark className="h-8 w-8" />
            <span>
              <strong>AMET</strong>
              <small>AVA</small>
            </span>
          </Link>
        </header>
        <main className="ava-public-main">{children}</main>
      </div>
    );
  }

  const items = navItemsForRole(user.role);

  return (
    <div className="ava-app">
      <aside className="ava-sidebar">
        <div className="ava-sidebar-top">
          <Link href={homeHref} className="ava-brand">
            <AmetMark className="h-9 w-9" />
            <span>
              <strong>AMET</strong>
              <small>AVA</small>
            </span>
          </Link>
          <p className="ava-sidebar-caption">{panelTitleForRole(user.role)}</p>
          <AvaSidebarNav items={items} />
        </div>

        <div className="ava-sidebar-foot">
          <div className="ava-session">
            <p className="ava-session-label">Sessão</p>
            <p className="ava-session-name">{user.name ?? user.email}</p>
            <p className="ava-session-role">{roleLabel(user.role)}</p>
          </div>
          <form action="/api/ava/logout" method="post">
            <button type="submit" className="ava-side-logout">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="ava-main-wrap">
        <header className="ava-main-top">
          <div>
            <p className="ava-kicker">AVA AMET</p>
            <p className="ava-main-top-title">{panelTitleForRole(user.role)}</p>
          </div>
          <div className="ava-main-chip">
            {user.name?.split(" ")[0] ?? "Usuário"} · {roleLabel(user.role)}
          </div>
        </header>
        <main className="ava-main">{children}</main>
      </div>
    </div>
  );
}
