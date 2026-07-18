import { homePathForRole } from "@/lib/ava/navigation";
import type { UserRole } from "@/lib/ava/schema";

/** Serializable active-route rules (safe to pass into Client Components). */
export type AvaNavMatch = {
  equals?: string[];
  startsWith?: string[];
  includes?: string[];
  excludes?: string[];
};

export type AvaNavItem = {
  href: string;
  label: string;
  match?: AvaNavMatch;
};

export function matchNavPath(
  pathname: string,
  match: AvaNavMatch | undefined,
  href: string,
): boolean {
  if (!match) {
    return pathname === href.split("#")[0];
  }

  const hasBase = Boolean(match.equals?.length || match.startsWith?.length);
  const baseOk =
    !hasBase ||
    Boolean(
      match.equals?.some((path) => pathname === path) ||
        match.startsWith?.some((path) => pathname.startsWith(path)),
    );

  if (!baseOk) return false;
  if (match.includes?.some((fragment) => !pathname.includes(fragment))) {
    return false;
  }
  if (match.excludes?.some((fragment) => pathname.includes(fragment))) {
    return false;
  }

  return true;
}

export function navItemsForRole(role: UserRole): AvaNavItem[] {
  switch (role) {
    case "admin":
      return [
        {
          href: "/ava/admin",
          label: "Painel",
          match: {
            equals: ["/ava/admin"],
            startsWith: ["/ava/admin/"],
          },
        },
        {
          href: "/ava/admin#turmas",
          label: "Turmas",
          match: { includes: ["/gerir"] },
        },
        {
          href: "/ava/admin#convidar",
          label: "Convites",
        },
        {
          href: "/ava/admin#matricular",
          label: "Matrículas",
        },
      ];
    case "professor":
      return [
        {
          href: "/ava/professor",
          label: "Painel",
          match: { equals: ["/ava/professor"] },
        },
        {
          href: "/ava/professor",
          label: "Minhas turmas",
          match: {
            startsWith: ["/ava/turmas/"],
            includes: ["/gerir"],
          },
        },
        {
          href: "/ava/professor",
          label: "Dúvidas",
          match: {
            includes: ["/aulas/"],
            excludes: ["/gerir"],
          },
        },
      ];
    case "aluno":
      return [
        {
          href: "/ava",
          label: "Minhas turmas",
          match: { equals: ["/ava"] },
        },
        {
          href: "/ava",
          label: "Aulas",
          match: {
            startsWith: ["/ava/turmas/"],
            excludes: ["/gerir"],
          },
        },
      ];
    default: {
      const _exhaustive: never = role;
      void _exhaustive;
      return [];
    }
  }
}

export function panelTitleForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Painel admin";
    case "professor":
      return "Painel professor";
    case "aluno":
      return "Área do aluno";
    default: {
      const _exhaustive: never = role;
      void _exhaustive;
      return "AVA";
    }
  }
}

export function panelHome(role: UserRole): string {
  return homePathForRole(role);
}
