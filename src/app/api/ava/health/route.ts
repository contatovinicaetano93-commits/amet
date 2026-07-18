import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/ava/db";
import {
  getInviteFromAddress,
  inviteEmailCanDeliverBroadly,
} from "@/lib/ava/invite-email";
import { avaLog, errorMessage } from "@/lib/ava/observability";
import { isUpstashConfigured } from "@/lib/ava/rate-limit";
import { isR2Configured, missingR2EnvKeys, probeR2Bucket } from "@/lib/ava/storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const started = Date.now();
  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";
  const from = getInviteFromAddress();
  const emailReady = inviteEmailCanDeliverBroadly(from);

  const checks: Record<string, "ok" | "error" | "missing" | "skipped"> = {
    api: "ok",
    database: "error",
    email: emailReady ? "ok" : process.env.RESEND_API_KEY ? "error" : "missing",
    upstash: isUpstashConfigured() ? "ok" : "missing",
    r2: isR2Configured() ? "ok" : "missing",
    sentry:
      process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
        ? "ok"
        : "missing",
  };

  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    checks.database = "ok";
  } catch (error) {
    avaLog.error("health.database_failed", { message: errorMessage(error) });
  }

  let r2Detail: string | undefined;
  if (deep) {
    if (!isR2Configured()) {
      checks.r2 = "missing";
      r2Detail = `Faltam: ${missingR2EnvKeys().join(", ")}`;
    } else {
      const probe = await probeR2Bucket();
      checks.r2 = probe.ok ? "ok" : "error";
      if (!probe.ok) r2Detail = probe.error;
    }
  } else if (checks.r2 === "ok") {
    // shallow: só valida presença de envs
    checks.r2 = "ok";
  }

  const healthy = checks.api === "ok" && checks.database === "ok";
  const body = {
    ok: healthy,
    service: "ava",
    checks,
    details: {
      r2: r2Detail,
      email: emailReady
        ? "Convites podem ser enviados para o e-mail digitado."
        : from.includes("resend.dev")
          ? "RESEND_FROM_EMAIL ainda usa resend.dev — só envia para o e-mail da conta Resend."
          : "Configure RESEND_API_KEY e RESEND_FROM_EMAIL com domínio verificado.",
      note: "upstash/sentry/r2/email 'missing|error' não derruba o AVA; database é obrigatório.",
    },
    latencyMs: Date.now() - started,
    ts: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
