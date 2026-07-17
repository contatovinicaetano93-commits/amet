import { requireRole } from "@/lib/ava/auth";
import { jsonError, jsonOk } from "@/lib/ava/http";
import {
  isR2Configured,
  MAX_VIDEO_BYTES,
  missingR2EnvKeys,
  probeR2Bucket,
} from "@/lib/ava/storage";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return jsonError("Não autorizado.", { status: 401 });
  }

  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "1";
  const configured = isR2Configured();
  const missing = missingR2EnvKeys();

  let probe:
    | { ok: true }
    | { ok: false; error: string }
    | { ok: false; skipped: true } = { ok: false, skipped: true };

  if (deep && configured) {
    probe = await probeR2Bucket();
  }

  return jsonOk({
    configured,
    missing,
    maxVideoBytes: MAX_VIDEO_BYTES,
    probe,
    corsHint:
      "No Cloudflare R2 → bucket → Settings → CORS, permita PUT/GET do domínio ametsaude.com.br (e localhost em dev).",
  });
}
