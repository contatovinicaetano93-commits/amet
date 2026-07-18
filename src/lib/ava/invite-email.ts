import { Resend } from "resend";

import { roleLabel } from "@/lib/ava/permissions";
import type { UserRole } from "@/lib/ava/schema";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function getInviteFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ??
    "AMET Saúde & Estética <onboarding@resend.dev>"
  );
}

export function inviteEmailCanDeliverBroadly(from = getInviteFromAddress()): boolean {
  return Boolean(process.env.RESEND_API_KEY) && !from.includes("resend.dev");
}

export async function sendAvaInviteEmail(params: {
  email: string;
  role: UserRole;
  inviteUrl: string;
}): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = getInviteFromAddress();
  const usesResendOnboarding = from.includes("resend.dev");
  const profile = roleLabel(params.role);

  const subject = `Convite AVA AMET — ative sua conta de ${profile}`;
  const text = [
    "Você foi convidado(a) para o Ambiente Virtual de Aprendizagem da AMET.",
    "",
    `Perfil: ${profile}`,
    "",
    "Para ativar sua conta e definir sua senha, acesse o link abaixo:",
    params.inviteUrl,
    "",
    "Este link expira em 7 dias.",
    "",
    "Se você não esperava este convite, ignore este e-mail.",
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1c2493;max-width:560px;margin:0 auto;padding:24px">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b21a8">AVA AMET</p>
    <h1 style="margin:0 0 12px;font-size:24px;color:#1c2493">Ative sua conta de ${escapeHtml(profile)}</h1>
    <p style="margin:0 0 16px;color:#334155">
      Você foi convidado(a) para o Ambiente Virtual de Aprendizagem da
      <strong>AMET Saúde &amp; Estética</strong>.
    </p>
    <p style="margin:0 0 20px;color:#334155">
      E-mail da conta: <strong>${escapeHtml(params.email)}</strong><br/>
      Perfil: <strong>${escapeHtml(profile)}</strong>
    </p>
    <p style="margin:0 0 24px">
      <a href="${escapeHtml(params.inviteUrl)}"
         style="display:inline-block;background:#1c2493;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">
        Ativar minha conta
      </a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#64748b">
      Se o botão não funcionar, copie e cole este link no navegador:
    </p>
    <p style="margin:0 0 20px;font-size:13px;word-break:break-all">
      <a href="${escapeHtml(params.inviteUrl)}" style="color:#2563eb">${escapeHtml(params.inviteUrl)}</a>
    </p>
    <p style="margin:0;font-size:12px;color:#94a3b8">Este link expira em 7 dias.</p>
  </div>`;

  if (!apiKey) {
    console.warn(
      "[ava-invite] RESEND_API_KEY ausente — simulando envio para:",
      params.email,
    );
    console.info(text);
    return {
      ok: false,
      error:
        "E-mail não configurado no servidor (RESEND_API_KEY). Use o link do convite abaixo.",
    };
  }

  if (usesResendOnboarding) {
    return {
      ok: false,
      error:
        "Remetente ainda é resend.dev. Configure RESEND_FROM_EMAIL com um e-mail do domínio verificado (ex.: noreply@ametsaude.com.br). Use o link abaixo enquanto isso.",
    };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [params.email],
    subject,
    text,
    html,
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
        ? `E-mail não enviado para ${params.email}: ${detail}. Use o link do convite abaixo.`
        : `E-mail não enviado para ${params.email}. Use o link do convite abaixo.`,
    };
  }

  console.info("[ava-invite] enviado", {
    to: params.email,
    role: params.role,
    id: data?.id,
  });

  return { ok: true };
}
