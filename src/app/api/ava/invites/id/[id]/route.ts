import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { jsonError } from "@/lib/ava/http";
import { avaLog } from "@/lib/ava/observability";
import { invites } from "@/lib/ava/schema";

type Params = { params: Promise<{ id: string }> };

/** Cancel a pending invite so the sent link stops working. */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const [invite] = await db
    .select({ id: invites.id, usedAt: invites.usedAt, email: invites.email })
    .from(invites)
    .where(eq(invites.id, id))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  }

  if (invite.usedAt) {
    return jsonError("Convite já usado não pode ser cancelado.", {
      status: 409,
      event: "invite.cancel_used",
    });
  }

  await db.delete(invites).where(eq(invites.id, id));

  avaLog.info("invite.cancelled", {
    inviteId: id,
    email: invite.email,
    adminId: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
