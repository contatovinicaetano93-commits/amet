import type { UserRole } from "@/lib/ava/schema";

export function homePathForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/ava/admin";
    case "professor":
      return "/ava/professor";
    case "aluno":
      return "/ava";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

/** Keep users off routes their role cannot open. */
export function sanitizeAvaCallbackUrl(
  callbackUrl: string | null | undefined,
  role: UserRole,
): string {
  const fallback = homePathForRole(role);
  if (!callbackUrl || !callbackUrl.startsWith("/ava")) {
    return fallback;
  }

  if (callbackUrl.startsWith("/ava/login")) {
    return fallback;
  }

  if (callbackUrl.startsWith("/ava/admin") && role !== "admin") {
    const classManage = callbackUrl.match(/^\/ava\/admin\/turmas\/([^/]+)/);
    if (classManage && role === "professor") {
      return `/ava/turmas/${classManage[1]}/gerir`;
    }
    return fallback;
  }

  return callbackUrl;
}

export function classManagePath(classId: string): string {
  return `/ava/turmas/${classId}/gerir`;
}
