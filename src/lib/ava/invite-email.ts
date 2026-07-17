import { Resend } from "resend";

import { roleLabel } from "@/lib/ava/permissions";
import type { UserRole } from "@/lib/ava/schema";

export async function sendAvaInviteEmail(params: {
  email: string;
  role: UserRole;
  inviteUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ??
    "AMET Saúde & Estética <onboarding@resend.dev>";

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
    console.warn("[ava-invite] RESEND_API_KEY ausente — simulando envio para:", params.email);
    console.info(text);
    return { ok: true };
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
    return { ok: false, error: "Não foi possível enviar o e-mail de convite." };
  }

  return { ok: true };
}
