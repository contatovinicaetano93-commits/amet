import type { CandidaturaInput } from "@/lib/schemas";
import { UNIDADES } from "@/lib/constants";
import { AREAS } from "@/lib/constants";

export function buildWhatsAppUrl(phone: string, data: CandidaturaInput): string {
  const unidadeLabels = data.unidades
    .map((code) => UNIDADES.find((u) => u.code === code)?.label ?? code)
    .join(", ");

  const areaLabels = data.areasInteresse
    .map((code) => AREAS[code].label)
    .join(", ");

  const text = [
    "Olá, AMET! Gostaria de informações sobre estágio.",
    "",
    `Perfil: ${data.tipoPerfil === "aluno" ? "Aluno AMET" : "Não aluno"}`,
    `Nome: ${data.nomeCompleto}`,
    `RGM: ${data.rgm}`,
    `CPF: ${data.cpf}`,
    `Telefone: ${data.telefone}`,
    `E-mail: ${data.email}`,
    `Unidade(s): ${unidadeLabels}`,
    `Curso: ${data.cursoAtual}`,
    `Área(s) de interesse: ${areaLabels}`,
  ].join("\n");

  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
