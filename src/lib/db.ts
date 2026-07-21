import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import { AREAS, type AreaCode, type PeriodoCode } from "@/lib/constants";
import { isAluno, type CandidaturaInput } from "@/lib/schemas";

export type CandidaturaRecord = CandidaturaInput & {
  id: string;
  createdAt: string;
};

type DatabaseFile = {
  candidaturas: CandidaturaRecord[];
};

let resolvedDataDir: string | null = null;

function canWriteDir(dir: string): boolean {
  try {
    mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.write-probe-${process.pid}`);
    writeFileSync(probe, "ok", "utf-8");
    unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

function getDataDir(): string {
  if (resolvedDataDir) return resolvedDataDir;

  const primary = path.join(process.cwd(), "data");
  if (canWriteDir(primary)) {
    resolvedDataDir = primary;
    return resolvedDataDir;
  }

  const fallback = path.join("/tmp", "amet-data");
  mkdirSync(fallback, { recursive: true });
  resolvedDataDir = fallback;
  return resolvedDataDir;
}

function getDbFile(): string {
  return path.join(getDataDir(), "candidaturas.json");
}

function ensureDatabase(): DatabaseFile {
  const dbFile = getDbFile();

  if (!existsSync(dbFile)) {
    const empty: DatabaseFile = { candidaturas: [] };
    writeFileSync(dbFile, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }

  try {
    const raw = readFileSync(dbFile, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseFile;
    if (!Array.isArray(parsed.candidaturas)) throw new Error("Invalid database");
    return parsed;
  } catch {
    const empty: DatabaseFile = { candidaturas: [] };
    writeFileSync(dbFile, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }
}

function saveDatabase(data: DatabaseFile): void {
  writeFileSync(getDbFile(), JSON.stringify(data, null, 2), "utf-8");
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

function countUsage(db: DatabaseFile, area: AreaCode, periodo: PeriodoCode): number {
  return db.candidaturas.filter(
    (item) => isAluno(item) && item.area === area && item.periodo === periodo,
  ).length;
}

export function getVacancyCounts(): AreaVacancy[] {
  const db = ensureDatabase();

  return (Object.entries(AREAS) as [AreaCode, (typeof AREAS)[AreaCode]][]).map(
    ([code, config]) => {
      const periodos: PeriodoVacancy[] = config.periodos.map((periodo) => {
        const used = countUsage(db, code, periodo);
        const total = config.limit;
        return {
          periodo,
          total,
          used,
          available: Math.max(total - used, 0),
          full: used >= total,
        };
      });

      return {
        code,
        label: config.label,
        periodos,
        full: periodos.every((p) => p.full),
      };
    },
  );
}

export function getPeriodoVacancy(area: AreaCode, periodo: PeriodoCode): PeriodoVacancy {
  const areaVacancy = getVacancyCounts().find((a) => a.code === area);
  const found = areaVacancy?.periodos.find((p) => p.periodo === periodo);
  if (found) return found;
  return {
    periodo,
    total: AREAS[area].limit,
    used: 0,
    available: AREAS[area].limit,
    full: false,
  };
}

export function listCandidaturas(): CandidaturaRecord[] {
  return ensureDatabase().candidaturas.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export type CreateCandidaturaResult =
  | { ok: true; candidatura: CandidaturaRecord }
  | { ok: false; error: string; code: "AREA_FULL" | "DUPLICATE" | "UNKNOWN" };

export function createCandidatura(input: CandidaturaInput): CreateCandidaturaResult {
  try {
    const db = ensureDatabase();

    if (isAluno(input)) {
      const vacancy = getPeriodoVacancy(input.area, input.periodo as PeriodoCode);
      if (vacancy.full) {
        return {
          ok: false,
          error: "Vagas esgotadas para esta área neste turno.",
          code: "AREA_FULL",
        };
      }

      const duplicate = db.candidaturas.some(
        (item) => isAluno(item) && item.cpf === input.cpf && item.area === input.area,
      );
      if (duplicate) {
        return {
          ok: false,
          error: "Você já possui uma candidatura nesta área com este CPF.",
          code: "DUPLICATE",
        };
      }
    }

    const candidatura: CandidaturaRecord = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    db.candidaturas.push(candidatura);
    saveDatabase(db);
    return { ok: true, candidatura };
  } catch (error) {
    console.error("[db] Falha ao gravar candidatura:", error);
    return {
      ok: false,
      error: "Não foi possível salvar a candidatura. Tente novamente.",
      code: "UNKNOWN",
    };
  }
}
