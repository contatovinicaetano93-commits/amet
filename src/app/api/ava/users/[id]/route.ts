import { and, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { jsonError } from "@/lib/ava/http";
import { avaLog } from "@/lib/ava/observability";
import { invites, users } from "@/lib/ava/schema";

type Params = { params: Promise<{ id: string }> };

/** Remove a user account (and related invites) from the AVA. */
export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return jsonError("Você não pode remover a própria conta.", {
      status: 400,
      event: "user.delete_self",
    });
  }

  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
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
        event: "user.delete_last_admin",
      });
    }
  }

  await db.delete(invites).where(eq(invites.email, user.email));
  await db.delete(users).where(eq(users.id, user.id));

  avaLog.info("user.deleted", {
    userId: user.id,
    email: user.email,
    role: user.role,
    adminId: session.user.id,
  });

  return NextResponse.json({
    ok: true,
    removedUser: { id: user.id, email: user.email, name: user.name },
  });
}
