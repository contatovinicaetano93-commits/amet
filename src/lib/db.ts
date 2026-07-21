import { Pool } from "pg";

import { AREAS, type AreaCode, type PeriodoCode } from "@/lib/constants";
import { isAluno, type CandidaturaInput } from "@/lib/schemas";

export type CandidaturaRecord = CandidaturaInput & {
  id: string;
  createdAt: string;
  emailSent: boolean;
  emailError: string | null;
};

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS candidaturas (
        id TEXT PRIMARY KEY,
        nome_completo TEXT NOT NULL,
        rgm TEXT DEFAULT '',
        cpf TEXT NOT NULL,
        telefone TEXT NOT NULL,
        email TEXT NOT NULL,
        tipo_perfil TEXT NOT NULL,
        unidade TEXT,
        area TEXT,
        periodo TEXT,
        dias TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_candidaturas_area_periodo
        ON candidaturas (area, periodo)
        WHERE tipo_perfil = 'aluno';
      CREATE UNIQUE INDEX IF NOT EXISTS idx_candidaturas_cpf_area_unique
        ON candidaturas (cpf, area)
        WHERE tipo_perfil = 'aluno';
      ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS email_error TEXT;
      CREATE TABLE IF NOT EXISTS admin_access_log (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ip TEXT NOT NULL,
        action TEXT NOT NULL,
        success BOOLEAN NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_admin_access_log_ip_created
        ON admin_access_log (ip, created_at);
    `).then(() => undefined);
  }
  return schemaReady;
}

type CandidaturaRow = {
  id: string;
  nome_completo: string;
  rgm: string | null;
  cpf: string;
  telefone: string;
  email: string;
  tipo_perfil: string;
  unidade: string | null;
  area: string | null;
  periodo: string | null;
  dias: string[] | null;
  created_at: Date;
  email_sent: boolean;
  email_error: string | null;
};

function rowToRecord(row: CandidaturaRow): CandidaturaRecord {
  const base = {
    id: row.id,
    nomeCompleto: row.nome_completo,
    rgm: row.rgm ?? "",
    cpf: row.cpf,
    telefone: row.telefone,
    email: row.email,
    createdAt: row.created_at.toISOString(),
    emailSent: row.email_sent,
    emailError: row.email_error,
  };

  if (row.tipo_perfil === "aluno") {
    return {
      ...base,
      tipoPerfil: "aluno",
      unidade: row.unidade ?? "",
      area: row.area ?? "",
      periodo: row.periodo ?? "",
      dias: row.dias ?? [],
    } as CandidaturaRecord;
  }

  return { ...base, tipoPerfil: "nao_aluno" } as CandidaturaRecord;
}

export type PeriodoVacancy = {
  periodo: PeriodoCode;
  total: number;
  used: number;
  available: number;
  full: boolean;
};

export type AreaVacancy = {
  code: AreaCode;
  label: string;
  periodos: PeriodoVacancy[];
  full: boolean;
};

async function countUsage(area: AreaCode, periodo: PeriodoCode): Promise<number> {
  await ensureSchema();
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM candidaturas
     WHERE tipo_perfil = 'aluno' AND area = $1 AND periodo = $2`,
    [area, periodo],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function getVacancyCounts(): Promise<AreaVacancy[]> {
  const entries = Object.entries(AREAS) as [AreaCode, (typeof AREAS)[AreaCode]][];

  return Promise.all(
    entries.map(async ([code, config]) => {
      const periodos: PeriodoVacancy[] = await Promise.all(
        config.periodos.map(async (periodo) => {
          const used = await countUsage(code, periodo);
          const total = config.limit;
          return {
            periodo,
            total,
            used,
            available: Math.max(total - used, 0),
            full: used >= total,
          };
        }),
      );

      return {
        code,
        label: config.label,
        periodos,
        full: periodos.every((p) => p.full),
      };
    }),
  );
}

export async function getPeriodoVacancy(
  area: AreaCode,
  periodo: PeriodoCode,
): Promise<PeriodoVacancy> {
  const used = await countUsage(area, periodo);
  const total = AREAS[area].limit;
  return {
    periodo,
    total,
    used,
    available: Math.max(total - used, 0),
    full: used >= total,
  };
}

export async function listCandidaturas(): Promise<CandidaturaRecord[]> {
  await ensureSchema();
  const result = await getPool().query<CandidaturaRow>(
    `SELECT * FROM candidaturas ORDER BY created_at DESC`,
  );
  return result.rows.map(rowToRecord);
}

export async function getCandidaturaById(id: string): Promise<CandidaturaRecord | null> {
  await ensureSchema();
  const result = await getPool().query<CandidaturaRow>(
    `SELECT * FROM candidaturas WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? rowToRecord(result.rows[0]) : null;
}

export async function updateEmailStatus(
  id: string,
  sent: boolean,
  error: string | null,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `UPDATE candidaturas SET email_sent = $2, email_error = $3 WHERE id = $1`,
    [id, sent, error],
  );
}

export async function logAdminAccess(
  ip: string,
  action: string,
  success: boolean,
): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO admin_access_log (ip, action, success) VALUES ($1, $2, $3)`,
    [ip, action, success],
  );
}

export async function countRecentFailedAttempts(
  ip: string,
  windowMinutes: number,
): Promise<number> {
  await ensureSchema();
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM admin_access_log
     WHERE ip = $1 AND success = false AND created_at > now() - ($2 || ' minutes')::interval`,
    [ip, windowMinutes],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export type CreateCandidaturaResult =
  | { ok: true; candidatura: CandidaturaRecord }
  | { ok: false; error: string; code: "AREA_FULL" | "DUPLICATE" | "UNKNOWN" };

export async function createCandidatura(
  input: CandidaturaInput,
): Promise<CreateCandidaturaResult> {
  await ensureSchema();
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    if (isAluno(input)) {
      const area = input.area;
      const periodo = input.periodo as PeriodoCode;

      // Serializes concurrent submissions for the same area+turno so the vacancy
      // check and insert below are atomic together (prevents overbooking when many
      // students submit to the same slot at once). Transaction-scoped, so it's
      // released automatically on COMMIT/ROLLBACK even under connection pooling.
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${area}:${periodo}`]);

      const usedResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM candidaturas
         WHERE tipo_perfil = 'aluno' AND area = $1 AND periodo = $2`,
        [area, periodo],
      );
      const used = Number(usedResult.rows[0]?.count ?? 0);
      const total = AREAS[area].limit;

      if (used >= total) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          error: "Vagas esgotadas para esta área neste turno.",
          code: "AREA_FULL",
        };
      }
    }

    const id = crypto.randomUUID();
    const isAlunoInput = isAluno(input);

    const result = await client.query<CandidaturaRow>(
      `INSERT INTO candidaturas
        (id, nome_completo, rgm, cpf, telefone, email, tipo_perfil, unidade, area, periodo, dias)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        input.nomeCompleto,
        input.rgm ?? "",
        input.cpf,
        input.telefone,
        input.email,
        input.tipoPerfil,
        isAlunoInput ? input.unidade : null,
        isAlunoInput ? input.area : null,
        isAlunoInput ? input.periodo : null,
        isAlunoInput ? input.dias : null,
      ],
    );

    await client.query("COMMIT");
    return { ok: true, candidatura: rowToRecord(result.rows[0]) };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return {
        ok: false,
        error: "Você já possui uma candidatura nesta área com este CPF.",
        code: "DUPLICATE",
      };
    }
    console.error("[db] Falha ao gravar candidatura:", error);
    return {
      ok: false,
      error: "Não foi possível salvar a candidatura. Tente novamente.",
      code: "UNKNOWN",
    };
  } finally {
    client.release();
  }
}
