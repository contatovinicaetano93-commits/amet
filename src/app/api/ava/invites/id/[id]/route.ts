import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { jsonError } from "@/lib/ava/http";
import { avaLog } from "@/lib/ava/observability";
import { invites, users } from "@/lib/ava/schema";

type Params = { params: Promise<{ id: string }> };

/**
 * Cancel a pending invite, or revoke an accepted invite by removing the
 * matching user account from the AVA.
 */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const [invite] = await db
    .select({
      id: invites.id,
      usedAt: invites.usedAt,
      email: invites.email,
      role: invites.role,
    })
    .from(invites)
    .where(eq(invites.id, id))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  }

  let removedUser: { id: string; email: string; name: string } | null = null;

  if (invite.usedAt) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1);

    if (user) {
      if (user.id === session.user.id) {
        return jsonError("Você não pode remover a própria conta.", {
          status: 400,
          event: "invite.cancel_self",
        });
      }

      if (user.role === "admin") {
        const otherAdmins = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.role, "admin"), ne(users.id, user.id)))
          .limit(1);
        if (otherAdmins.length === 0) {
          return jsonError("Não é possível remover o último administrador.", {
            status: 409,
            event: "invite.cancel_last_admin",
          });
        }
      }

      await db.delete(users).where(eq(users.id, user.id));
      removedUser = { id: user.id, email: user.email, name: user.name };
    }
  }

  await db.delete(invites).where(eq(invites.id, id));

  avaLog.info("invite.cancelled", {
    inviteId: id,
    email: invite.email,
    wasAccepted: Boolean(invite.usedAt),
    removedUserId: removedUser?.id ?? null,
    adminId: session.user.id,
  });

  return NextResponse.json({
    ok: true,
    removedUser,
    wasAccepted: Boolean(invite.usedAt),
  });
}
