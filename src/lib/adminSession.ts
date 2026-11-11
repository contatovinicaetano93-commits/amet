import crypto from "crypto";
import { cookies } from "next/headers";

import { expectedAdminKey } from "@/lib/adminAuth";

export const ADMIN_SESSION_COOKIE = "amet_admin_session";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function sessionSecret(): string {
  return expectedAdminKey();
}

export function signAdminSession(): string {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + TWELVE_HOURS_MS })).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function adminSessionValid(token: string | undefined): boolean {
  if (!token) return false;
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  const expected = crypto.createHmac("sha256", sessionSecret()).update(body).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function hasAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return adminSessionValid(jar.get(ADMIN_SESSION_COOKIE)?.value);
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWELVE_HOURS_MS / 1000,
  };
}
