import { Pool } from "pg";

import {
  AREAS,
  areasDisponiveis,
  periodosDisponiveis,
  vagaLimit,
  type AreaCode,
  type PeriodoCode,
  type UnidadeCode,
} from "@/lib/constants";
import { isNaoAluno, type CandidaturaInput } from "@/lib/schemas";

export type CandidaturaRecord = CandidaturaInput & {
  id: string;
  createdAt: string;
  emailSent: boolean;
  emailError: string | null;
};

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export function ensureSchema(): Promise<void> {
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
        faculdade TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_candidaturas_area_periodo
        ON candidaturas (area, periodo)
        WHERE tipo_perfil = 'aluno';
      CREATE INDEX IF NOT EXISTS idx_candidaturas_area_unidade_periodo
        ON candidaturas (area, unidade, periodo)
        WHERE tipo_perfil = 'aluno';
      ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS email_error TEXT;
      ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS faculdade TEXT;
      CREATE TABLE IF NOT EXISTS admin_access_log (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ip TEXT NOT NULL,
        action TEXT NOT NULL,
        success BOOLEAN NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_admin_access_log_ip_created
        ON admin_access_log (ip, created_at);
    `).then(async () => {
      await getPool().query(`DROP INDEX IF EXISTS idx_candidaturas_cpf_area_unique`);
      try {
        await getPool().query(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_candidaturas_cpf_unique
          ON candidaturas (cpf)
        `);
      } catch (error) {
        // Se já existirem CPFs duplicados na base antiga, a regra continua
        // enforced no createCandidatura; o índice pode ser criado depois da limpeza.
        console.error("[db] Não foi possível criar índice único de CPF:", error);
      }
    });
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
  faculdade: string | null;
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

  const estagio = {
    unidade: row.unidade ?? "",
    area: row.area ?? "",
    periodo: row.periodo ?? "",
    dias: row.dias ?? [],
  };

  if (row.tipo_perfil === "aluno") {
    return {
      ...base,
      ...estagio,
      tipoPerfil: "aluno",
    } as CandidaturaRecord;
  }

  return {
    ...base,
    ...estagio,
    tipoPerfil: "nao_aluno",
    faculdade: row.faculdade ?? "",
  } as CandidaturaRecord;
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

async function countUsage(
  area: AreaCode,
  unidade: UnidadeCode,
  periodo: PeriodoCode,
): Promise<number> {
  await ensureSchema();
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM candidaturas
     WHERE tipo_perfil = 'aluno' AND area = $1 AND unidade = $2 AND periodo = $3`,
    [area, unidade, periodo],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function getVacancyCounts(
  unidade: UnidadeCode,
): Promise<AreaVacancy[]> {
  const areas = areasDisponiveis(unidade);

  return Promise.all(
    areas.map(async (code) => {
      const periodos: PeriodoVacancy[] = await Promise.all(
        periodosDisponiveis(code, unidade).map(async (periodo) => {
          const used = await countUsage(code, unidade, periodo);
          const total = vagaLimit(code, unidade, periodo);
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
        label: AREAS[code].label,
        periodos,
        full: periodos.length > 0 && periodos.every((p) => p.full),
      };
    }),
  );
}

export async function getPeriodoVacancy(
  area: AreaCode,
  unidade: UnidadeCode,
  periodo: PeriodoCode,
): Promise<PeriodoVacancy> {
  const used = await countUsage(area, unidade, periodo);
  const total = vagaLimit(area, unidade, periodo);
  return {
    periodo,
    total,
    used,
    available: Math.max(total - used, 0),
    full: total <= 0 || used >= total,
  };
}

export async function listCandidaturas(): Promise<CandidaturaRecord[]> {
  await ensureSchema();
  const result = await getPool().query<CandidaturaRow>(
    `SELECT * FROM candidaturas ORDER BY created_at DESC`,
  );
  return result.rows.map(rowToRecord);
}

export async function deleteCandidaturasByCpfs(
  cpfs: string[],
): Promise<{ deleted: number; ids: string[] }> {
  await ensureSchema();
  const normalized = [
    ...new Set(
      cpfs
        .map((cpf) => cpf.replace(/\D/g, ""))
        .map((cpf) => (cpf.length === 10 ? cpf.padStart(11, "0") : cpf))
        .filter((cpf) => cpf.length === 11),
    ),
  ];
  if (normalized.length === 0) {
    return { deleted: 0, ids: [] };
  }

  const result = await getPool().query<{ id: string }>(
    `DELETE FROM candidaturas WHERE cpf = ANY($1::text[]) RETURNING id`,
    [normalized],
  );
  return { deleted: result.rowCount ?? 0, ids: result.rows.map((row) => row.id) };
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

    // Serializes concurrent submissions for the same CPF (1 cadastro por CPF).
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`cpf:${input.cpf}`]);

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM candidaturas WHERE cpf = $1 LIMIT 1`,
      [input.cpf],
    );
    if (existing.rows[0]) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        error: "Já existe um cadastro com este CPF. Só é permitido um cadastro por CPF.",
        code: "DUPLICATE",
      };
    }

    const area = input.area as AreaCode;
    const unidade = input.unidade as UnidadeCode;
    const periodo = input.periodo as PeriodoCode;
    const total = vagaLimit(area, unidade, periodo);

    if (total <= 0) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        error: "Esta combinação de área, unidade e turno não está disponível.",
        code: "AREA_FULL",
      };
    }

    const id = crypto.randomUUID();

    const result = await client.query<CandidaturaRow>(
      `INSERT INTO candidaturas
        (id, nome_completo, rgm, cpf, telefone, email, tipo_perfil, unidade, area, periodo, dias, faculdade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        input.nomeCompleto,
        input.rgm ?? "",
        input.cpf,
        input.telefone,
        input.email,
        input.tipoPerfil,
        input.unidade,
        input.area,
        input.periodo,
        input.dias,
        isNaoAluno(input) ? input.faculdade : null,
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
        error: "Já existe um cadastro com este CPF. Só é permitido um cadastro por CPF.",
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

export type UpdateCandidaturaResult =
  | { ok: true; candidatura: CandidaturaRecord }
  | { ok: false; error: string; code: "NOT_FOUND" | "DUPLICATE" | "AREA_FULL" | "UNKNOWN" };

export async function updateCandidatura(
  id: string,
  input: CandidaturaInput,
): Promise<UpdateCandidaturaResult> {
  await ensureSchema();
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`cpf:${input.cpf}`]);

    const current = await client.query<{ id: string }>(
      `SELECT id FROM candidaturas WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (!current.rows[0]) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Candidatura não encontrada.", code: "NOT_FOUND" };
    }

    const duplicate = await client.query<{ id: string }>(
      `SELECT id FROM candidaturas WHERE cpf = $1 AND id <> $2 LIMIT 1`,
      [input.cpf, id],
    );
    if (duplicate.rows[0]) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        error: "Já existe um cadastro com este CPF. Só é permitido um cadastro por CPF.",
        code: "DUPLICATE",
      };
    }

    const area = input.area as AreaCode;
    const unidade = input.unidade as UnidadeCode;
    const periodo = input.periodo as PeriodoCode;
    const total = vagaLimit(area, unidade, periodo);
    if (total <= 0) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        error: "Esta combinação de área, unidade e turno não está disponível.",
        code: "AREA_FULL",
      };
    }

    const result = await client.query<CandidaturaRow>(
      `UPDATE candidaturas SET
        nome_completo = $2, rgm = $3, cpf = $4, telefone = $5, email = $6,
        tipo_perfil = $7, unidade = $8, area = $9, periodo = $10, dias = $11, faculdade = $12
       WHERE id = $1
       RETURNING *`,
      [
        id,
        input.nomeCompleto,
        input.rgm ?? "",
        input.cpf,
        input.telefone,
        input.email,
        input.tipoPerfil,
        input.unidade,
        input.area,
        input.periodo,
        input.dias,
        isNaoAluno(input) ? input.faculdade : null,
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
        error: "Já existe um cadastro com este CPF. Só é permitido um cadastro por CPF.",
        code: "DUPLICATE",
      };
    }
    console.error("[db] Falha ao atualizar candidatura:", error);
    return {
      ok: false,
      error: "Não foi possível salvar a candidatura. Tente novamente.",
      code: "UNKNOWN",
    };
  } finally {
    client.release();
  }
}

export async function deleteCandidaturaById(id: string): Promise<boolean> {
  await ensureSchema();
  const result = await getPool().query(
    `DELETE FROM candidaturas WHERE id = $1`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
