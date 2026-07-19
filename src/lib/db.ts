import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import { AREAS, type AreaCode } from "@/lib/constants";
import type { CandidaturaInput } from "@/lib/schemas";

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

function getAreaFromRecord(item: CandidaturaRecord): AreaCode[] {
  if (item.areasInteresse?.length) return item.areasInteresse;
  const legacy = (item as { areaInteresse?: AreaCode }).areaInteresse;
  return legacy ? [legacy] : [];
}

export function getVacancyCounts(): Record<
  AreaCode,
  { total: number; used: number; available: number; full: boolean }
> {
  const db = ensureDatabase();

  return Object.fromEntries(
    Object.entries(AREAS).map(([code, area]) => {
      const used = db.candidaturas.filter((item) => {
        if (item.tipoPerfil === "nao_aluno") return false;
        return getAreaFromRecord(item).includes(code as AreaCode);
      }).length;
      const available = Math.max(area.limit - used, 0);
      return [code, { total: area.limit, used, available, full: used >= area.limit }];
    }),
  ) as Record<AreaCode, { total: number; used: number; available: number; full: boolean }>;
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
    const counts = getVacancyCounts();

    if (input.tipoPerfil === "aluno") {
      const area = input.areasInteresse[0];
      if (counts[area].full) {
        return { ok: false, error: "Vagas esgotadas para esta área.", code: "AREA_FULL" };
      }
      const duplicate = db.candidaturas.some(
        (item) =>
          item.tipoPerfil === "aluno" &&
          item.cpf === input.cpf &&
          getAreaFromRecord(item).includes(area),
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
