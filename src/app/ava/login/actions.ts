"use server";

import { AuthError } from "@auth/core/errors";
import { headers } from "next/headers";

import { signIn } from "@/lib/ava/auth";
import { avaLog } from "@/lib/ava/observability";
import { rateLimit } from "@/lib/ava/rate-limit";
import { loginSchema } from "@/lib/ava/schemas";

export async function loginAction(
  formData: FormData,
  callbackUrl = "/ava",
): Promise<{ error?: string } | void> {
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
  const limited = rateLimit({
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
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl.startsWith("/ava") ? callbackUrl : "/ava",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      avaLog.warn("auth.login_failed", { email: parsed.data.email });
      return { error: "E-mail ou senha inválidos." };
    }
    // Next.js redirect throws; rethrow so navigation works.
    throw error;
  }
}
