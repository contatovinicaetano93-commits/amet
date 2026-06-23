import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "candidaturas.json");

function ensureDatabase(): DatabaseFile {
  mkdirSync(DATA_DIR, { recursive: true });

  if (!existsSync(DB_FILE)) {
    const empty: DatabaseFile = { candidaturas: [] };
    writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }

  try {
    const raw = readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseFile;
    if (!Array.isArray(parsed.candidaturas)) throw new Error("Invalid database");
    return parsed;
  } catch {
    const empty: DatabaseFile = { candidaturas: [] };
    writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }
}

function saveDatabase(data: DatabaseFile): void {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
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
}
