import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { AREAS, type AreaCode } from "@/lib/constants";
import type { CandidaturaInput } from "@/lib/schemas";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export type CandidaturaRecord = {
  id: string;
  nomeCompleto: string;
  rgm: string;
  cpf: string;
  telefone: string;
  email: string;
  areaInteresse: string;
  cursoAtual: string;
  createdAt: Date;
};

export async function getVacancyCounts(): Promise<
  Record<
    AreaCode,
    { total: number; used: number; available: number; full: boolean }
  >
> {
  const counts = Object.fromEntries(
    await Promise.all(
      Object.entries(AREAS).map(async ([code, area]) => {
        const used = await prisma.candidatura.count({
          where: { areaInteresse: code },
        });
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
  | { ok: true; candidatura: CandidaturaRecord }
  | { ok: false; error: string; code: "AREA_FULL" | "DUPLICATE" | "UNKNOWN" };

export async function createCandidatura(
  input: CandidaturaInput,
): Promise<CreateCandidaturaResult> {
  const counts = await getVacancyCounts();

  if (counts[input.areaInteresse].full) {
    return {
      ok: false,
      error: "Vagas esgotadas para esta área.",
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
        error: "Você já possui uma candidatura nesta área com este CPF.",
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
