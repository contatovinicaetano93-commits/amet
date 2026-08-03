#!/usr/bin/env node
/**
 * Remove candidaturas pelos CPFs listados em
 * data/source/excluir-candidaturas-cpfs.json
 *
 * Uso:
 *   DATABASE_URL=... node scripts/delete-candidaturas-by-cpf.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LIST_FILE = path.join(ROOT, "data", "source", "excluir-candidaturas-cpfs.json");

function stripDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeCpf(raw) {
  let digits = stripDigits(raw);
  if (digits.length === 10) digits = digits.padStart(11, "0");
  return digits;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[delete-candidaturas] DATABASE_URL ausente — nada a fazer.");
    process.exit(1);
  }

  const payload = JSON.parse(readFileSync(LIST_FILE, "utf8"));
  const cpfs = [...new Set((payload.cpfs ?? []).map(normalizeCpf).filter(Boolean))];
  if (cpfs.length === 0) {
    console.log("[delete-candidaturas] Lista vazia.");
    return;
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const before = await pool.query(
      `SELECT id, nome_completo, cpf, tipo_perfil FROM candidaturas WHERE cpf = ANY($1::text[])`,
      [cpfs],
    );
    console.log(`[delete-candidaturas] Encontradas ${before.rowCount} candidatura(s) para ${cpfs.length} CPF(s).`);
    for (const row of before.rows) {
      console.log(`  - ${row.cpf} | ${row.tipo_perfil} | ${row.nome_completo}`);
    }

    const result = await pool.query(
      `DELETE FROM candidaturas WHERE cpf = ANY($1::text[]) RETURNING id, cpf, nome_completo`,
      [cpfs],
    );
    console.log(`[delete-candidaturas] Removidas ${result.rowCount} candidatura(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[delete-candidaturas] Falha:", error);
  process.exit(1);
});
