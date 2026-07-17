import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/ava/db";
import { avaLog, errorMessage } from "@/lib/ava/observability";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const checks: Record<string, "ok" | "error"> = {
    api: "ok",
    database: "error",
  };

  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    checks.database = "ok";
  } catch (error) {
    avaLog.error("health.database_failed", { message: errorMessage(error) });
  }

  const healthy = Object.values(checks).every((status) => status === "ok");
  const body = {
    ok: healthy,
    service: "ava",
    checks,
    latencyMs: Date.now() - started,
    ts: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
