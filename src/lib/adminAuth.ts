import crypto from "crypto";

import { ADMIN_SESSION_COOKIE, adminSessionValid, readCookieValue } from "@/lib/adminSession";
import { countRecentFailedAttempts, logAdminAccess } from "@/lib/db";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_FAILURES = 10;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export type AdminCheckResult = { ok: true } | { ok: false; status: number; error: string };

export function expectedAdminKey(): string {
  return process.env.ADMIN_KEY ?? "amet-admin";
}

export async function checkAdminAccess(request: Request, action: string): Promise<AdminCheckResult> {
  const ip = getClientIp(request);

  const recentFailures = await countRecentFailedAttempts(ip, RATE_LIMIT_WINDOW_MINUTES);
  if (recentFailures >= RATE_LIMIT_MAX_FAILURES) {
    return { ok: false, status: 429, error: "Muitas tentativas. Tente novamente mais tarde." };
  }

  const sessionOk = adminSessionValid(readCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE));
  const expected = expectedAdminKey();
  const provided = request.headers.get("x-admin-key") ?? "";
  const success = sessionOk || timingSafeEqual(provided, expected);

  await logAdminAccess(ip, action, success);

  if (!success) {
    return { ok: false, status: 401, error: "Não autorizado" };
  }
  return { ok: true };
}
