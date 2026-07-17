import type { UserRole } from "@/lib/ava/schema";

export function isAdmin(role: UserRole | string | undefined): boolean {
  return role === "admin";
}

export function isTeacher(role: UserRole | string | undefined): boolean {
  return role === "professor" || role === "admin";
}

export function isStudent(role: UserRole | string | undefined): boolean {
  return role === "aluno";
}

export function canManageClass(
  role: UserRole | string | undefined,
  teacherId: string | null | undefined,
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  if (role === "admin") return true;
  if (role === "professor" && teacherId === userId) return true;
  return false;
}

export function roleLabel(role: UserRole | string): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "professor":
      return "Professor";
    case "aluno":
      return "Aluno";
    default: {
      const _exhaustive: never = role as never;
      return String(_exhaustive);
    }
  }
}
