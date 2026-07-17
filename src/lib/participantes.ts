import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { stripDigits } from "@/lib/validators";

const DATA_DIR = path.join(process.cwd(), "data");
const PARTICIPANTES_FILE = path.join(DATA_DIR, "participantes.json");

type ParticipantesFile = {
  cpfs: string[];
};

let cachedCpfs: Set<string> | null = null;

function ensureParticipantesFile(): ParticipantesFile {
  mkdirSync(DATA_DIR, { recursive: true });

  if (!existsSync(PARTICIPANTES_FILE)) {
    const empty: ParticipantesFile = { cpfs: [] };
    writeFileSync(PARTICIPANTES_FILE, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }

  try {
    const raw = readFileSync(PARTICIPANTES_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ParticipantesFile | string[];
    if (Array.isArray(parsed)) {
      return { cpfs: parsed.map(stripDigits) };
    }
    if (!Array.isArray(parsed.cpfs)) throw new Error("Invalid participantes file");
    return { cpfs: parsed.cpfs.map(stripDigits) };
  } catch {
    const empty: ParticipantesFile = { cpfs: [] };
    writeFileSync(PARTICIPANTES_FILE, JSON.stringify(empty, null, 2), "utf-8");
    return empty;
  }
}

function getCpfSet(): Set<string> {
  if (cachedCpfs) return cachedCpfs;
  const { cpfs } = ensureParticipantesFile();
  cachedCpfs = new Set(cpfs);
  return cachedCpfs;
}

export function isParticipanteCpf(cpf: string): boolean {
  const digits = stripDigits(cpf);
  return getCpfSet().has(digits);
}
