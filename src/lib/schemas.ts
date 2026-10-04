import { z } from "zod";

import {
  AREA_CODES,
  CURSO_CODES,
  DIAS,
  ESTADO_CODES,
  FACULDADE_VALUES,
  FORMA_PAGAMENTO_CODES,
  HORARIO_FACULDADE_CODES,
  PERIODOS,
  SEMESTRES,
  UNIDADES,
  areasDisponiveis,
  diasDisponiveis,
  periodosDisponiveis,
  requiresFormaPagamento,
  type AreaCode,
  type PeriodoCode,
  type UnidadeCode,
} from "@/lib/constants";
import { isValidBirthDate, isValidCep, isValidCpf, stripDigits } from "@/lib/validators";

const unidadeCodes = UNIDADES.map((u) => u.code) as [string, ...string[]];
const diaCodes = DIAS.map((d) => d.code) as [string, ...string[]];
const periodoCodes = PERIODOS.map((p) => p.code) as [string, ...string[]];

export const cpfLookupSchema = z.object({
  cpf: z.string().trim().refine(isValidCpf, "CPF inválido").transform(stripDigits),
});

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
  rua: z.string().trim().min(2, "Informe a rua").max(120),
  numero: z.string().trim().min(1, "Informe o número").max(20),
  complemento: z.string().trim().max(60).default(""),
  bairro: z.string().trim().min(2, "Informe o bairro").max(80),
  cep: z
    .string()
    .trim()
    .refine(isValidCep, "CEP inválido")
    .transform(stripDigits),
  cidade: z.string().trim().min(2, "Informe a cidade").max(80),
  estado: z.enum(ESTADO_CODES, { message: "Selecione o estado" }),
  dataNascimento: z
    .string()
    .trim()
    .refine(isValidBirthDate, "Data de nascimento inválida"),
  horarioFaculdade: z.enum(HORARIO_FACULDADE_CODES, {
    message: "Selecione o horário da faculdade",
  }),
  semestreAtual: z.enum(SEMESTRES, { message: "Selecione o semestre atual" }),
  curso: z.enum(CURSO_CODES, { message: "Selecione o curso" }),
});

const estagioFields = z.object({
  unidade: z.enum(unidadeCodes, { message: "Selecione uma unidade" }),
  area: z.enum(AREA_CODES, { message: "Selecione uma área" }),
  periodo: z.enum(periodoCodes, { message: "Selecione um turno" }),
  dias: z
    .array(z.enum(diaCodes))
    .min(1, "Selecione os dias de estágio")
    .max(2, "Selecione no máximo 2 dias"),
});

/** Dias: exatamente 2 (úteis), ou apenas Sábado sozinho. Nunca 1 útil nem 3+. */
export function diasSelectionError(dias: readonly string[]): string | null {
  if (dias.length === 0) {
    return "Selecione os dias de estágio";
  }
  const hasSabado = dias.includes("sab");
  if (hasSabado) {
    if (dias.length !== 1) {
      return "Sábado não pode ser combinado com outros dias";
    }
    return null;
  }
  if (dias.length === 1) {
    return "Selecione 2 dias — apenas Sábado pode ser escolhido sozinho";
  }
  if (dias.length > 2) {
    return "Selecione no máximo 2 dias";
  }
  return null;
}

function refineEstagio(
  data: z.infer<typeof estagioFields>,
  ctx: z.RefinementCtx,
) {
  const area = data.area as AreaCode;
  const periodo = data.periodo as PeriodoCode;
  const unidade = data.unidade as UnidadeCode;

  if (!areasDisponiveis(unidade).includes(area)) {
    ctx.addIssue({
      code: "custom",
      message: "Esta área não está disponível nesta unidade",
      path: ["area"],
    });
  }

  if (!periodosDisponiveis(area, unidade).includes(periodo)) {
    ctx.addIssue({
      code: "custom",
      message: "Turno indisponível para esta área nesta unidade",
      path: ["periodo"],
    });
  }

  const allowedDias = new Set<string>(diasDisponiveis(area, periodo));
  for (const dia of data.dias) {
    if (!allowedDias.has(dia)) {
      ctx.addIssue({
        code: "custom",
        message: "Dia indisponível para o turno selecionado",
        path: ["dias"],
      });
      break;
    }
  }

  const diasError = diasSelectionError(data.dias);
  if (diasError) {
    ctx.addIssue({
      code: "custom",
      message: diasError,
      path: ["dias"],
    });
  }
}

export const candidaturaAlunoSchema = personalDataSchema
  .extend({
    rgm: z.string().trim().min(1, "Informe seu RGM").max(20),
    tipoPerfil: z.literal("aluno"),
  })
  .merge(estagioFields)
  .superRefine(refineEstagio);

export const candidaturaNaoAlunoSchema = personalDataSchema
  .extend({
    tipoPerfil: z.literal("nao_aluno"),
    faculdade: z.enum(FACULDADE_VALUES, { message: "Selecione a faculdade" }),
    formaPagamento: z.enum(FORMA_PAGAMENTO_CODES).optional(),
  })
  .merge(estagioFields)
  .superRefine((data, ctx) => {
    refineEstagio(data, ctx);
    if (requiresFormaPagamento(data.faculdade) && !data.formaPagamento) {
      ctx.addIssue({
        code: "custom",
        message: "Selecione a forma de pagamento",
        path: ["formaPagamento"],
      });
    }
  });

export const candidaturaSchema = z.discriminatedUnion("tipoPerfil", [
  candidaturaAlunoSchema,
  candidaturaNaoAlunoSchema,
]);

export type CandidaturaInput = z.infer<typeof candidaturaSchema>;
export type CandidaturaAlunoInput = z.infer<typeof candidaturaAlunoSchema>;
export type CandidaturaNaoAlunoInput = z.infer<typeof candidaturaNaoAlunoSchema>;
export type PersonalData = z.infer<typeof personalDataSchema>;

export function isAluno(data: CandidaturaInput): data is CandidaturaAlunoInput {
  return data.tipoPerfil === "aluno";
}

export function isNaoAluno(
  data: CandidaturaInput,
): data is CandidaturaNaoAlunoInput {
  return data.tipoPerfil === "nao_aluno";
}

export const participanteCreateSchema = z.object({
  cpf: z.string().trim().refine(isValidCpf, "CPF inválido").transform(stripDigits),
  nome: z.string().trim().min(3, "Informe o nome completo").max(120),
  rgm: z.string().trim().max(20).default(""),
});

export const participanteUpdateSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo").max(120),
  rgm: z.string().trim().max(20).default(""),
});

export type ParticipanteCreateInput = z.infer<typeof participanteCreateSchema>;
export type ParticipanteUpdateInput = z.infer<typeof participanteUpdateSchema>;
