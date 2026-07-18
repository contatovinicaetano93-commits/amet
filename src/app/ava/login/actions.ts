"use server";

import { AuthError } from "@auth/core/errors";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { signIn } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { sanitizeAvaCallbackUrl } from "@/lib/ava/navigation";
import { avaLog } from "@/lib/ava/observability";
import { rateLimit } from "@/lib/ava/rate-limit";
import { users, type UserRole } from "@/lib/ava/schema";
import { loginSchema } from "@/lib/ava/schemas";

export async function loginAction(
  formData: FormData,
  callbackUrl = "/ava",
): Promise<{ error?: string; redirectTo?: string }> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Informe e-mail e senha válidos." };
  }

  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const limited = await rateLimit({
    key: `login:${ip}:${parsed.data.email}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!limited.ok) {
    avaLog.warn("auth.login_rate_limited", { email: parsed.data.email });
    return {
      error: `Muitas tentativas. Aguarde ${limited.retryAfterSec}s e tente novamente.`,
    };
  }

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) {
      avaLog.warn("auth.login_failed", { email: parsed.data.email });
      return { error: "E-mail ou senha inválidos." };
    }

    const db = getDb();
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    const role = (user?.role ?? "aluno") as UserRole;
    const redirectTo = sanitizeAvaCallbackUrl(callbackUrl, role);
    avaLog.info("auth.login_ok", { role });
    return { redirectTo };
  } catch (error) {
    if (error instanceof AuthError) {
      avaLog.warn("auth.login_failed", { email: parsed.data.email });
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}
