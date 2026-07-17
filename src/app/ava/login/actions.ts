"use server";

import { AuthError } from "@auth/core/errors";

import { signIn } from "@/lib/ava/auth";
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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl.startsWith("/ava") ? callbackUrl : "/ava",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    // Next.js redirect throws; rethrow so navigation works.
    throw error;
  }
}
