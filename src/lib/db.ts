import { Pool } from "pg";

import participantesSeed from "../../data/participantes.json";

import {
  AREAS,
  areasDisponiveis,
  periodosDisponiveis,
  vagaLimit,
  type AreaCode,
  type PeriodoCode,
  type UnidadeCode,
} from "@/lib/constants";
import { isAluno, type CandidaturaInput } from "@/lib/schemas";
import { normalizeCpfDigits } from "@/lib/validators";

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
      CREATE INDEX IF NOT EXISTS idx_candidaturas_area_unidade_periodo
        ON candidaturas (area, unidade, periodo)
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
      CREATE TABLE IF NOT EXISTS participantes (
        cpf TEXT PRIMARY KEY,
        nome TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_participantes_nome
        ON participantes (nome);
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
      await seedParticipantesIfEmpty();
    });
  }
  return schemaReady;
}

async function seedParticipantesIfEmpty(): Promise<void> {
  const countResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM participantes`,
  );
  if (Number(countResult.rows[0]?.count ?? 0) > 0) return;

  const raw = participantesSeed as { cpfs?: string[] } | string[];
  const list = Array.isArray(raw) ? raw : (raw.cpfs ?? []);
  const cpfs = [
    ...new Set(
      list
        .map((cpf) => normalizeCpfDigits(String(cpf)))
        .filter((cpf) => cpf.length === 11),
    ),
  ];
  if (cpfs.length === 0) return;

  // Bulk insert in chunks to keep the first boot under control.
  const chunkSize = 500;
  for (let i = 0; i < cpfs.length; i += chunkSize) {
    const chunk = cpfs.slice(i, i + chunkSize);
    const values: string[] = [];
    const params: string[] = [];
    chunk.forEach((cpf, index) => {
      values.push(`($${index + 1})`);
      params.push(cpf);
    });
    await getPool().query(
      `INSERT INTO participantes (cpf) VALUES ${values.join(",")}
       ON CONFLICT (cpf) DO NOTHING`,
      params,
    );
  }
  console.log(`[db] Seed participantes: ${cpfs.length} CPF(s).`);
}

export type ParticipanteRecord = {
  cpf: string;
  nome: string;
  createdAt: string;
  updatedAt: string;
};

type ParticipanteRow = {
  cpf: string;
  nome: string;
  created_at: Date;
  updated_at: Date;
};

function participanteRowToRecord(row: ParticipanteRow): ParticipanteRecord {
  return {
    cpf: row.cpf,
    nome: row.nome ?? "",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function isParticipanteCpf(cpf: string): Promise<boolean> {
  await ensureSchema();
  const normalized = normalizeCpfDigits(cpf);
  if (normalized.length !== 11) return false;
  const result = await getPool().query<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM participantes WHERE cpf = $1) AS exists`,
    [normalized],
  );
  return Boolean(result.rows[0]?.exists);
}

export async function listParticipantes(options?: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: ParticipanteRecord[]; total: number }> {
  await ensureSchema();
  const q = (options?.q ?? "").trim();
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const offset = Math.max(options?.offset ?? 0, 0);
  const digits = normalizeCpfDigits(q);

  const params: Array<string | number> = [];
  let where = "";
  if (q) {
    params.push(`%${q}%`);
    const nomeParam = `$${params.length}`;
    if (digits.length >= 3) {
      params.push(`${digits}%`);
      where = `WHERE nome ILIKE ${nomeParam} OR cpf LIKE $${params.length}`;
    } else {
      where = `WHERE nome ILIKE ${nomeParam} OR cpf ILIKE ${nomeParam}`;
    }
  }

  const totalResult = await getPool().query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM participantes ${where}`,
    params,
  );
  const total = Number(totalResult.rows[0]?.count ?? 0);

  params.push(limit, offset);
  const result = await getPool().query<ParticipanteRow>(
    `SELECT cpf, nome, created_at, updated_at
     FROM participantes
     ${where}
     ORDER BY COALESCE(NULLIF(nome, ''), cpf) ASC, cpf ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return { items: result.rows.map(participanteRowToRecord), total };
}

export type ParticipanteMutationResult =
  | { ok: true; participante: ParticipanteRecord }
  | { ok: false; error: string; code: "INVALID" | "DUPLICATE" | "NOT_FOUND" };

export async function addParticipante(
  cpf: string,
  nome = "",
): Promise<ParticipanteMutationResult> {
  await ensureSchema();
  const normalized = normalizeCpfDigits(cpf);
  if (normalized.length !== 11) {
    return { ok: false, error: "CPF inválido", code: "INVALID" };
  }

  try {
    const result = await getPool().query<ParticipanteRow>(
      `INSERT INTO participantes (cpf, nome)
       VALUES ($1, $2)
       RETURNING cpf, nome, created_at, updated_at`,
      [normalized, nome.trim()],
    );
    return { ok: true, participante: participanteRowToRecord(result.rows[0]) };
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return { ok: false, error: "Este CPF já está na base de alunos.", code: "DUPLICATE" };
    }
    throw error;
  }
}

export async function updateParticipante(
  cpf: string,
  updates: { newCpf?: string; nome?: string },
): Promise<ParticipanteMutationResult> {
  await ensureSchema();
  const current = normalizeCpfDigits(cpf);
  if (current.length !== 11) {
    return { ok: false, error: "CPF inválido", code: "INVALID" };
  }

  const nextCpf =
    updates.newCpf !== undefined ? normalizeCpfDigits(updates.newCpf) : current;
  if (nextCpf.length !== 11) {
    return { ok: false, error: "Novo CPF inválido", code: "INVALID" };
  }

  const existing = await getPool().query<ParticipanteRow>(
    `SELECT cpf, nome, created_at, updated_at FROM participantes WHERE cpf = $1`,
    [current],
  );
  if (!existing.rows[0]) {
    return { ok: false, error: "Aluno não encontrado na base.", code: "NOT_FOUND" };
  }

  const nextNome =
    updates.nome !== undefined ? updates.nome.trim() : (existing.rows[0].nome ?? "");

  try {
    const result = await getPool().query<ParticipanteRow>(
      `UPDATE participantes
       SET cpf = $2, nome = $3, updated_at = now()
       WHERE cpf = $1
       RETURNING cpf, nome, created_at, updated_at`,
      [current, nextCpf, nextNome],
    );
    if (!result.rows[0]) {
      return { ok: false, error: "Aluno não encontrado na base.", code: "NOT_FOUND" };
    }
    return { ok: true, participante: participanteRowToRecord(result.rows[0]) };
  } catch (error) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      return {
        ok: false,
        error: "Já existe outro aluno com este CPF.",
        code: "DUPLICATE",
      };
    }
    throw error;
  }
}

export async function deleteParticipantesByCpfs(
  cpfs: string[],
): Promise<{ deleted: number; cpfs: string[] }> {
  await ensureSchema();
  const normalized = [
    ...new Set(
      cpfs
        .map((cpf) => normalizeCpfDigits(cpf))
        .filter((cpf) => cpf.length === 11),
    ),
  ];
  if (normalized.length === 0) {
    return { deleted: 0, cpfs: [] };
  }

  const result = await getPool().query<{ cpf: string }>(
    `DELETE FROM participantes WHERE cpf = ANY($1::text[]) RETURNING cpf`,
    [normalized],
  );
  return {
    deleted: result.rowCount ?? 0,
    cpfs: result.rows.map((row) => row.cpf),
  };
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
        .map((cpf) => normalizeCpfDigits(cpf))
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
  | {
      ok: false;
      error: string;
      code: "AREA_FULL" | "DUPLICATE" | "CPF_NOT_IN_BASE" | "UNKNOWN";
    };

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

    if (isAluno(input)) {
      // Lock the allowlist row for the rest of this transaction so a concurrent
      // admin delete cannot remove the CPF after the check and before insert.
      const allowed = await client.query<{ cpf: string }>(
        `SELECT cpf FROM participantes WHERE cpf = $1 FOR SHARE`,
        [input.cpf],
      );
      if (!allowed.rows[0]) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          error:
            "CPF não encontrado na base de alunos AMET. Selecione “Não sou aluno AMET” ou verifique o CPF.",
          code: "CPF_NOT_IN_BASE",
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

      // Serializes concurrent submissions for the same area+unidade+turno so the
      // vacancy check and insert below are atomic together.
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `${area}:${unidade}:${periodo}`,
      ]);

      const usedResult = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM candidaturas
         WHERE tipo_perfil = 'aluno' AND area = $1 AND unidade = $2 AND periodo = $3`,
        [area, unidade, periodo],
      );
      const used = Number(usedResult.rows[0]?.count ?? 0);

      if (used >= total) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          error: "Vagas esgotadas para esta área nesta unidade e turno.",
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
