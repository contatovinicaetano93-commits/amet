import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/ava/db";
import { jsonError } from "@/lib/ava/http";
import { avaLog } from "@/lib/ava/observability";
import { hashPassword } from "@/lib/ava/password";
import { clientKey, rateLimit } from "@/lib/ava/rate-limit";
import { invites, users } from "@/lib/ava/schema";
import { acceptInviteSchema } from "@/lib/ava/schemas";
import { hashToken } from "@/lib/ava/tokens";

export async function POST(request: Request) {
  try {
    const limited = await rateLimit({
      key: clientKey(request, "invite-accept"),
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return jsonError("Muitas tentativas. Aguarde e tente de novo.", {
        status: 429,
        event: "invite.accept_rate_limited",
      });
    }

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

    // Claim the invite first so concurrent accepts cannot double-create.
    const [invite] = await db
      .update(invites)
      .set({ usedAt: now })
      .where(
        and(
          eq(invites.tokenHash, tokenHash),
          isNull(invites.usedAt),
          gt(invites.expiresAt, now),
        ),
      )
      .returning();

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

    try {
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

      avaLog.info("invite.accepted", {
        role: user.role,
        inviteId: invite.id,
      });

      return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
      // Best-effort rollback so the invite can be retried.
      await db
        .update(invites)
        .set({ usedAt: null })
        .where(eq(invites.id, invite.id));
      throw error;
    }
  } catch (error) {
    avaLog.error("invite.accept_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return jsonError("Não foi possível ativar o convite. Tente novamente.", {
      status: 500,
      event: "invite.accept_failed",
    });
  }
}
