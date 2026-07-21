import { z } from "zod";

import { AREAS, UNIDADES, PERIODOS } from "@/lib/constants";
import { isValidCpf, stripDigits } from "@/lib/validators";

const areaCodes = Object.keys(AREAS) as [keyof typeof AREAS, ...Array<keyof typeof AREAS>];
const unidadeCodes = Object.keys(UNIDADES) as [keyof typeof UNIDADES, ...Array<keyof typeof UNIDADES>];
const periodoCodes = [...PERIODOS] as const as typeof PERIODOS;

export const cpfSchema = z.object({
  cpf: z
    .string()
    .trim()
    .refine(isValidCpf, "CPF inválido")
    .transform(stripDigits),
});

export const leadDataSchema = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(120, "E-mail muito longo"),
  telefone: z
    .string()
    .trim()
    .transform(stripDigits)
    .refine((value) => value.length >= 10 && value.length <= 11, "Telefone inválido"),
});

export const alunoDataSchema = z.object({
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
  email: z.string().trim().email("E-mail inválido").max(120, "E-mail muito longo"),
  telefone: z
    .string()
    .trim()
    .transform(stripDigits)
    .refine((value) => value.length >= 10 && value.length <= 11, "Telefone inválido"),
});

export const unidadeSchema = z.object({
  unidade: z.enum(unidadeCodes, { message: "Selecione uma unidade" }),
});

export const areaSchema = z.object({
  areaInteresse: z.enum(areaCodes, { message: "Selecione uma área de interesse" }),
});

export const periodoSchema = z.object({
  periodo: z.enum(periodoCodes, { message: "Selecione um período" }),
});

export const leadSchema = cpfSchema.merge(leadDataSchema);

export const candidaturaSchema = cpfSchema
  .merge(alunoDataSchema)
  .merge(unidadeSchema)
  .merge(areaSchema)
  .merge(periodoSchema);

export type CPFInput = z.infer<typeof cpfSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
export type CandidaturaInput = z.infer<typeof candidaturaSchema>;
