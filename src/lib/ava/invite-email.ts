import { Resend } from "resend";

import { roleLabel } from "@/lib/ava/permissions";
import type { UserRole } from "@/lib/ava/schema";

export async function sendAvaInviteEmail(params: {
  email: string;
  role: UserRole;
  inviteUrl: string;
}): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ??
    "AMET Saúde & Estética <onboarding@resend.dev>";
  const usesResendOnboarding = from.includes("resend.dev");

  const subject = "Convite para o AVA AMET";
  const text = [
    "Você foi convidado(a) para o Ambiente Virtual de Aprendizagem da AMET.",
    "",
    `Perfil: ${roleLabel(params.role)}`,
    "",
    "Para ativar sua conta e definir sua senha, acesse:",
    params.inviteUrl,
    "",
    "Este link expira em 7 dias.",
  ].join("\n");

  if (!apiKey) {
    console.warn(
      "[ava-invite] RESEND_API_KEY ausente — simulando envio para:",
      params.email,
    );
    console.info(text);
    return {
      ok: true,
      warning:
        "E-mail não configurado no servidor. Use o link do convite abaixo.",
    };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [params.email],
    subject,
    text,
  });

  if (error) {
    console.error("[ava-invite] Falha ao enviar:", error);
    const detail =
      typeof error === "object" && error && "message" in error
        ? String((error as { message?: string }).message)
        : "";
    return {
      ok: false,
      error: detail
        ? `E-mail não enviado: ${detail}. Use o link do convite abaixo.`
        : "E-mail não enviado. Use o link do convite abaixo.",
    };
  }

  if (usesResendOnboarding) {
    return {
      ok: true,
      warning:
        "Remetente ainda é resend.dev — o e-mail pode não chegar em Gmail. Prefira o link abaixo.",
    };
  }

  return { ok: true };
}
