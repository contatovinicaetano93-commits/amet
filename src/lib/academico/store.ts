import { getPool } from "@/lib/db";
import type { AcademicoDb } from "@/lib/academico/types";

const SCHEMA_VERSION = 1;

let schemaReady: Promise<void> | null = null;

function emptyDb(): AcademicoDb {
  return {
    schemaVersion: SCHEMA_VERSION,
    students: [],
    courses: [],
    disciplines: [],
    enrollments: [],
    grades: [],
    documents: [],
    certificates: [],
    professors: [],
    onlineClasses: [],
  };
}

function normalize(value: unknown): AcademicoDb {
  const db = (value && typeof value === "object" ? value : {}) as Partial<AcademicoDb>;
  return {
    schemaVersion: SCHEMA_VERSION,
    students: db.students ?? [],
    courses: db.courses ?? [],
    disciplines: db.disciplines ?? [],
    enrollments: db.enrollments ?? [],
    grades: db.grades ?? [],
    documents: db.documents ?? [],
    certificates: db.certificates ?? [],
    professors: db.professors ?? [],
    onlineClasses: db.onlineClasses ?? [],
  };
}

async function ensureAcademicoSchema() {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS academico_state (
          id integer PRIMARY KEY CHECK (id = 1),
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`,
      )
      .then(() => undefined);
  }
  await schemaReady;
}

export async function readAcademico(): Promise<AcademicoDb> {
  await ensureAcademicoSchema();
  const result = await getPool().query<{ data: AcademicoDb }>("SELECT data FROM academico_state WHERE id = 1");
  if (!result.rowCount) return emptyDb();
  return normalize(result.rows[0].data);
}

export async function updateAcademico<T>(mutate: (db: AcademicoDb) => T): Promise<T> {
  await ensureAcademicoSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query<{ data: AcademicoDb }>("SELECT data FROM academico_state WHERE id = 1 FOR UPDATE");
    const db = existing.rowCount ? normalize(existing.rows[0].data) : emptyDb();
    const result = mutate(db);
    if (!existing.rowCount) {
      await client.query("INSERT INTO academico_state (id, data) VALUES (1, $1::jsonb)", [JSON.stringify(db)]);
    } else {
      await client.query("UPDATE academico_state SET data = $1::jsonb, updated_at = now() WHERE id = 1", [
        JSON.stringify(db),
      ]);
    }
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
