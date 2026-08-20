import participantesData from "../../data/participantes.json";

import { getPool, ensureSchema } from "@/lib/db";
import type { ParticipanteCreateInput, ParticipanteUpdateInput } from "@/lib/schemas";
import { stripDigits } from "@/lib/validators";

export type ParticipanteRecord = {
  cpf: string;
  nome: string;
  rgm: string;
  createdAt: string;
  updatedAt: string;
};

type ParticipanteRow = {
  cpf: string;
  nome: string;
  rgm: string;
  created_at: Date;
  updated_at: Date;
};

let participantesReady: Promise<void> | null = null;

function toIso(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

function rowToRecord(row: ParticipanteRow): ParticipanteRecord {
  return {
    cpf: row.cpf,
    nome: row.nome ?? "",
    rgm: row.rgm ?? "",
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function seedFromJsonIfEmpty(): Promise<void> {
  const count = await getPool().query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM participantes`,
  );
  if (Number(count.rows[0]?.n ?? 0) > 0) return;

  const parsed = participantesData as { cpfs?: string[] } | string[];
  const list = Array.isArray(parsed) ? parsed : parsed.cpfs ?? [];
  const cpfs = [
    ...new Set(
      list
        .map((cpf) => stripDigits(String(cpf)))
        .map((cpf) => (cpf.length === 10 ? cpf.padStart(11, "0") : cpf))
        .filter((cpf) => cpf.length === 11),
    ),
  ];
  if (cpfs.length === 0) return;

  const empty = cpfs.map(() => "");
  await getPool().query(
    `INSERT INTO participantes (cpf, nome, rgm)
     SELECT * FROM unnest($1::text[], $2::text[], $3::text[])
     ON CONFLICT (cpf) DO NOTHING`,
    [cpfs, empty, empty],
  );
}

async function migrateParticipantesTable(): Promise<void> {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS participantes (
      cpf TEXT PRIMARY KEY,
      nome TEXT NOT NULL DEFAULT '',
      rgm TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await getPool().query(
    `ALTER TABLE participantes ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT ''`,
  );
  await getPool().query(
    `ALTER TABLE participantes ADD COLUMN IF NOT EXISTS rgm TEXT NOT NULL DEFAULT ''`,
  );
  await getPool().query(
    `ALTER TABLE participantes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
  );
  await getPool().query(
    `ALTER TABLE participantes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
  );
  await getPool().query(
    `CREATE INDEX IF NOT EXISTS idx_participantes_nome ON participantes (nome)`,
  );
}

export function ensureParticipantesSchema(): Promise<void> {
  if (!participantesReady) {
    participantesReady = ensureSchema()
      .then(() => migrateParticipantesTable())
      .then(() => seedFromJsonIfEmpty())
      .catch((error) => {
        participantesReady = null;
        throw error;
      });
  }
  return participantesReady;
}

export async function isParticipanteCpf(cpf: string): Promise<boolean> {
  await ensureParticipantesSchema();
  const result = await getPool().query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM participantes WHERE cpf = $1) AS exists`,
    [stripDigits(cpf)],
  );
  return Boolean(result.rows[0]?.exists);
}

export async function listParticipantes(): Promise<ParticipanteRecord[]> {
  await ensureParticipantesSchema();
  const result = await getPool().query<ParticipanteRow>(
    `SELECT * FROM participantes ORDER BY
      CASE WHEN nome = '' THEN 1 ELSE 0 END,
      nome ASC,
      cpf ASC`,
  );
  return result.rows.map(rowToRecord);
}

export async function getParticipante(cpf: string): Promise<ParticipanteRecord | null> {
  await ensureParticipantesSchema();
  const result = await getPool().query<ParticipanteRow>(
    `SELECT * FROM participantes WHERE cpf = $1`,
    [stripDigits(cpf)],
  );
  return result.rows[0] ? rowToRecord(result.rows[0]) : null;
}

export type ParticipanteWriteResult =
  | { ok: true; participante: ParticipanteRecord }
  | { ok: false; error: string; code: "DUPLICATE" | "NOT_FOUND" | "UNKNOWN" };

export async function createParticipante(
  input: ParticipanteCreateInput,
): Promise<ParticipanteWriteResult> {
  await ensureParticipantesSchema();
  try {
    const result = await getPool().query<ParticipanteRow>(
      `INSERT INTO participantes (cpf, nome, rgm)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.cpf, input.nome, input.rgm ?? ""],
    );
    return { ok: true, participante: rowToRecord(result.rows[0]) };
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return { ok: false, error: "Já existe um aluno com este CPF.", code: "DUPLICATE" };
    }
    console.error("[db] Falha ao criar participante:", error);
    return { ok: false, error: "Não foi possível salvar o aluno.", code: "UNKNOWN" };
  }
}

export async function updateParticipante(
  cpf: string,
  input: ParticipanteUpdateInput,
): Promise<ParticipanteWriteResult> {
  await ensureParticipantesSchema();
  const result = await getPool().query<ParticipanteRow>(
    `UPDATE participantes
     SET nome = $2, rgm = $3, updated_at = now()
     WHERE cpf = $1
     RETURNING *`,
    [stripDigits(cpf), input.nome, input.rgm ?? ""],
  );
  if (!result.rows[0]) {
    return { ok: false, error: "Aluno não encontrado.", code: "NOT_FOUND" };
  }
  return { ok: true, participante: rowToRecord(result.rows[0]) };
}

export async function deleteParticipante(cpf: string): Promise<boolean> {
  await ensureParticipantesSchema();
  const result = await getPool().query(
    `DELETE FROM participantes WHERE cpf = $1`,
    [stripDigits(cpf)],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function upsertParticipanteFromCandidatura(input: {
  cpf: string;
  nome: string;
  rgm: string;
}): Promise<void> {
  await ensureParticipantesSchema();
  await getPool().query(
    `INSERT INTO participantes (cpf, nome, rgm)
     VALUES ($1, $2, $3)
     ON CONFLICT (cpf) DO UPDATE SET
       nome = CASE
         WHEN EXCLUDED.nome <> '' THEN EXCLUDED.nome
         ELSE participantes.nome
       END,
       rgm = CASE
         WHEN EXCLUDED.rgm <> '' THEN EXCLUDED.rgm
         ELSE participantes.rgm
       END,
       updated_at = now()`,
    [stripDigits(input.cpf), input.nome, input.rgm ?? ""],
  );
}
