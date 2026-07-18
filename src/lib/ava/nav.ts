import { homePathForRole } from "@/lib/ava/navigation";
import type { UserRole } from "@/lib/ava/schema";

export type AvaNavItem = {
  href: string;
  label: string;
  match?: (pathname: string) => boolean;
};

export function navItemsForRole(role: UserRole): AvaNavItem[] {
  switch (role) {
    case "admin":
      return [
        {
          href: "/ava/admin",
          label: "Painel",
          match: (pathname) =>
            pathname === "/ava/admin" || pathname.startsWith("/ava/admin/"),
        },
        {
          href: "/ava/admin#turma",
          label: "Turmas",
          match: (pathname) => pathname.includes("/gerir"),
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
          match: (pathname) => pathname === "/ava/professor",
        },
        {
          href: "/ava/professor",
          label: "Minhas turmas",
          match: (pathname) =>
            pathname.startsWith("/ava/turmas/") && pathname.includes("/gerir"),
        },
        {
          href: "/ava/professor",
          label: "Dúvidas",
          match: (pathname) =>
            pathname.includes("/aulas/") && !pathname.includes("/gerir"),
        },
      ];
    case "aluno":
      return [
        {
          href: "/ava",
          label: "Minhas turmas",
          match: (pathname) => pathname === "/ava",
        },
        {
          href: "/ava",
          label: "Aulas",
          match: (pathname) =>
            pathname.startsWith("/ava/turmas/") &&
            !pathname.includes("/gerir"),
        },
      ];
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
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
      return _exhaustive;
    }
  }
}

export function panelHome(role: UserRole): string {
  return homePathForRole(role);
}
