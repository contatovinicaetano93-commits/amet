import { Resend } from "resend";

import { AREAS, UNIDADES } from "@/lib/constants";
import { siteContent } from "@/lib/content";
import type { CandidaturaInput } from "@/lib/schemas";

function buildSubject(nomeCompleto: string): string {
  return `Inscrições AMET 2027 — ${nomeCompleto}`;
}

function formatCandidaturaBody(data: CandidaturaInput): string {
  const unidadeLabels = data.unidades
    .map((code) => UNIDADES.find((u) => u.code === code)?.label ?? code)
    .join(", ");

  const areaLabels = data.areasInteresse
    .map((code) => AREAS[code].label)
    .join(", ");

  const perfil = data.tipoPerfil === "aluno" ? "Aluno AMET" : "Não aluno AMET";

  return [
    buildSubject(data.nomeCompleto),
    "",
    `Perfil: ${perfil}`,
    `Nome: ${data.nomeCompleto}`,
    `RGM: ${data.rgm}`,
    `CPF: ${data.cpf}`,
    `Telefone: ${data.telefone}`,
    `E-mail: ${data.email}`,
    `Unidade(s): ${unidadeLabels}`,
    `Curso: ${data.cursoAtual}`,
    `Área(s) de interesse: ${areaLabels}`,
    "",
    `Enviado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
  ].join("\n");
}

export async function sendCandidaturaEmail(
  data: CandidaturaInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const to = process.env.CANDIDATURA_EMAIL_TO ?? siteContent.contatoEmail;
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "AMET Saúde & Estética <onboarding@resend.dev>";

  if (!to) {
    console.error("[email] E-mail de destino não configurado.");
    return { ok: false, error: "E-mail de destino não configurado no servidor." };
  }

  const subject = buildSubject(data.nomeCompleto);
  const text = formatCandidaturaBody(data);

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY ausente — simulando envio para:", to);
    console.info(text);
    return { ok: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    text,
  });

  if (error) {
    console.error("[email] Falha ao enviar:", error);
    return { ok: false, error: "Não foi possível enviar o e-mail. Tente novamente." };
  }

  return { ok: true };
}
