import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/ava/db";
import { hashPassword } from "@/lib/ava/password";
import { invites, users } from "@/lib/ava/schema";
import { acceptInviteSchema } from "@/lib/ava/schemas";
import { hashToken } from "@/lib/ava/tokens";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = acceptInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const tokenHash = hashToken(parsed.data.token);
  const now = new Date();

  const [invite] = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.tokenHash, tokenHash),
        isNull(invites.usedAt),
        gt(invites.expiresAt, now),
      ),
    )
    .limit(1);

  if (!invite) {
    return NextResponse.json(
      { error: "Convite inválido ou expirado." },
      { status: 404 },
    );
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Este e-mail já possui conta." },
      { status: 409 },
    );
  }

  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: invite.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: invite.role,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  await db
    .update(invites)
    .set({ usedAt: now })
    .where(eq(invites.id, invite.id));

  return NextResponse.json({ user }, { status: 201 });
}
