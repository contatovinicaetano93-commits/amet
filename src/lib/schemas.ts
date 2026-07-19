import { z } from "zod";

import { AREAS, CURSOS, TIPOS_PERFIL, UNIDADES } from "@/lib/constants";
import { isValidCpf, stripDigits } from "@/lib/validators";

const areaCodes = Object.keys(AREAS) as [keyof typeof AREAS, ...Array<keyof typeof AREAS>];
const unidadeCodes = UNIDADES.map((u) => u.code) as [string, ...string[]];

export const personalDataSchema = z.object({
  nomeCompleto: z.string().trim().min(3, "Informe seu nome completo").max(120),
  rgm: z.string().trim().max(20).default(""),
  cpf: z.string().trim().refine(isValidCpf, "CPF inválido").transform(stripDigits),
  telefone: z
    .string()
    .trim()
    .transform(stripDigits)
    .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido"),
  email: z.string().trim().email("E-mail inválido").max(120),
});

export const cpfLookupSchema = z.object({
  cpf: z.string().trim().refine(isValidCpf, "CPF inválido").transform(stripDigits),
});

export const candidaturaSchema = z
  .object({
    tipoPerfil: z.enum(TIPOS_PERFIL, { message: "Selecione se você é aluno ou não aluno" }),
    unidades: z.array(z.enum(unidadeCodes)).min(1, "Selecione ao menos uma unidade"),
    cursoAtual: z.enum(CURSOS, { message: "Selecione um curso" }),
    areasInteresse: z.array(z.enum(areaCodes)).min(1, "Selecione ao menos uma área"),
  })
  .merge(personalDataSchema)
  .superRefine((data, ctx) => {
    if (data.tipoPerfil === "aluno") {
      if (!data.rgm.trim()) {
        ctx.addIssue({ code: "custom", message: "Informe seu RGM", path: ["rgm"] });
      }
      if (data.unidades.length !== 1) {
        ctx.addIssue({ code: "custom", message: "Selecione uma unidade", path: ["unidades"] });
      }
      if (data.areasInteresse.length !== 1) {
        ctx.addIssue({ code: "custom", message: "Selecione uma área", path: ["areasInteresse"] });
      }
    }
  });

export type CandidaturaInput = z.infer<typeof candidaturaSchema>;
export type PersonalData = z.infer<typeof personalDataSchema>;
