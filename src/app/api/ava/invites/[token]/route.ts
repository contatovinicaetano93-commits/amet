import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/ava/db";
import { invites } from "@/lib/ava/schema";
import { hashToken } from "@/lib/ava/tokens";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Convite inválido." }, { status: 400 });
  }

  const db = getDb();
  const [invite] = await db
    .select({
      email: invites.email,
      role: invites.role,
      expiresAt: invites.expiresAt,
    })
    .from(invites)
    .where(
      and(
        eq(invites.tokenHash, hashToken(token)),
        isNull(invites.usedAt),
        gt(invites.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!invite) {
    return NextResponse.json(
      { error: "Convite inválido ou expirado." },
      { status: 404 },
    );
  }

  return NextResponse.json({ invite });
}
