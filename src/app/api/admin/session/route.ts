import { NextResponse } from "next/server";

import { adminCredentialsMatch, adminLoginConfigured } from "@/lib/adminPassword";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  hasAdminSession,
  signAdminSession,
} from "@/lib/adminSession";
import { countRecentFailedAttempts, logAdminAccess } from "@/lib/db";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET() {
  if (await hasAdminSession()) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 401 });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const recentFailures = await countRecentFailedAttempts(ip, 15);
  if (recentFailures >= 10) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  if (!adminLoginConfigured()) {
    return NextResponse.json({ error: "O acesso do admin ainda não foi configurado." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const success = adminCredentialsMatch(email, password);
  await logAdminAccess(ip, "login", success);
  if (!success) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, signAdminSession(), adminSessionCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminSessionCookieOptions(), maxAge: 0 });
  return response;
}
