import { z } from "zod";

import { AREAS, CURSOS } from "@/lib/constants";
import { isValidCpf, stripDigits } from "@/lib/validators";

const areaCodes = Object.keys(AREAS) as [keyof typeof AREAS, ...Array<keyof typeof AREAS>];

export const personalDataSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120, "Nome muito longo"),
  rgm: z
    .string()
    .trim()
    .min(1, "Informe seu RGM")
    .max(20, "RGM inválido"),
  cpf: z
    .string()
    .trim()
    .refine(isValidCpf, "CPF inválido")
    .transform(stripDigits),
  telefone: z
    .string()
    .trim()
    .transform(stripDigits)
    .refine((value) => value.length >= 10 && value.length <= 11, "Telefone inválido"),
  email: z.string().trim().email("E-mail inválido").max(120, "E-mail muito longo"),
});

export const areaSchema = z.object({
  areaInteresse: z.enum(areaCodes, { message: "Selecione uma área de interesse" }),
});

export const cursoSchema = z.object({
  cursoAtual: z.enum(CURSOS, { message: "Selecione seu curso atual na AMET" }),
});

export const candidaturaSchema = personalDataSchema
  .merge(areaSchema)
  .merge(cursoSchema);

export type PersonalData = z.infer<typeof personalDataSchema>;
export type CandidaturaInput = z.infer<typeof candidaturaSchema>;
