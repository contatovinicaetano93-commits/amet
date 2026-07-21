import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { AREAS, type AreaCode } from "@/lib/constants";
import type { CandidaturaInput, LeadInput } from "@/lib/schemas";
import studentsData from "@/data/students.json";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type StudentRecord = {
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  rgm: string;
  curso: string;
};

const studentsMap = new Map(
  (studentsData as StudentRecord[]).map((s) => [s.cpf, s]),
);

export function findStudentByCpf(cpf: string) {
  return studentsMap.get(cpf);
}

export async function getVacancyCounts(
  areaCode?: AreaCode,
  periodo?: string,
): Promise<
  Record<
    AreaCode,
    { total: number; used: number; available: number; full: boolean }
  >
> {
  const counts = Object.fromEntries(
    await Promise.all(
      Object.entries(AREAS).map(async ([code, area]) => {
        const where: Record<string, unknown> = { areaInteresse: code };
        if (periodo) where.periodo = periodo;

        const used = await prisma.candidatura.count({ where });
        const available = Math.max(area.limit - used, 0);
        return [
          code,
          {
            total: area.limit,
            used,
            available,
            full: used >= area.limit,
          },
        ];
      }),
    ),
  ) as Record<
    AreaCode,
    { total: number; used: number; available: number; full: boolean }
  >;

  return counts;
}

export type CreateCandidaturaResult =
  | { ok: true; candidatura: any }
  | { ok: false; error: string; code: "AREA_FULL" | "DUPLICATE" | "UNKNOWN" };

export async function createCandidatura(
  input: CandidaturaInput,
): Promise<CreateCandidaturaResult> {
  const counts = await getVacancyCounts(
    input.areaInteresse as AreaCode,
    input.periodo,
  );

  if (counts[input.areaInteresse as AreaCode].full) {
    return {
      ok: false,
      error: "Vagas esgotadas para esta área neste período.",
      code: "AREA_FULL",
    };
  }

  try {
    const candidatura = await prisma.candidatura.create({
      data: input,
    });

    return { ok: true, candidatura };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return {
        ok: false,
        error: "Você já possui uma candidatura nesta área e período com este CPF.",
        code: "DUPLICATE",
      };
    }

    return {
      ok: false,
      error: "Erro ao criar candidatura.",
      code: "UNKNOWN",
    };
  }
}

export async function createLead(input: LeadInput) {
  try {
    const lead = await prisma.lead.create({
      data: input,
    });
    return { ok: true, lead };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return {
        ok: false,
        error: "Este CPF já foi registrado como lead.",
        code: "DUPLICATE" as const,
      };
    }

    return {
      ok: false,
      error: "Erro ao registrar lead.",
      code: "UNKNOWN" as const,
    };
  }
}
