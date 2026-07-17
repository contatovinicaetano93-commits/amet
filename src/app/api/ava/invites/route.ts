import { and, desc, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { sendAvaInviteEmail } from "@/lib/ava/invite-email";
import { invites, users } from "@/lib/ava/schema";
import { inviteCreateSchema } from "@/lib/ava/schemas";
import { createInviteToken, hashToken } from "@/lib/ava/tokens";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      expiresAt: invites.expiresAt,
      usedAt: invites.usedAt,
      createdAt: invites.createdAt,
    })
    .from(invites)
    .orderBy(desc(invites.createdAt));

  return NextResponse.json({ invites: rows });
}

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: "Já existe um usuário com este e-mail." },
      { status: 409 },
    );
  }

  const pendingInvites = await db
    .select({ id: invites.id })
    .from(invites)
    .where(
      and(eq(invites.email, parsed.data.email), isNull(invites.usedAt)),
    );

  for (const pendingInvite of pendingInvites) {
    await db
      .update(invites)
      .set({ usedAt: new Date() })
      .where(eq(invites.id, pendingInvite.id));
  }

  const token = createInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [invite] = await db
    .insert(invites)
    .values({
      email: parsed.data.email,
      role: parsed.data.role,
      tokenHash: hashToken(token),
      expiresAt,
      createdBy: session.user.id,
      usedAt: null,
    })
    .returning({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      expiresAt: invites.expiresAt,
    });

  const origin = new URL(request.url).origin;
  const inviteUrl = `${origin}/ava/convite/${token}`;
  const emailResult = await sendAvaInviteEmail({
    email: parsed.data.email,
    role: parsed.data.role,
    inviteUrl,
  });

  if (!emailResult.ok) {
    return NextResponse.json(
      {
        invite,
        warning: emailResult.error,
        inviteUrl:
          process.env.NODE_ENV === "development" ? inviteUrl : undefined,
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    {
      invite,
      inviteUrl:
        process.env.NODE_ENV === "development" || !process.env.RESEND_API_KEY
          ? inviteUrl
          : undefined,
    },
    { status: 201 },
  );
}
