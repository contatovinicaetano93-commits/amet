import { and, eq, gt, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AcceptInviteForm } from "@/components/ava/AcceptInviteForm";
import { getDb } from "@/lib/ava/db";
import { roleLabel } from "@/lib/ava/permissions";
import { invites } from "@/lib/ava/schema";
import { hashToken } from "@/lib/ava/tokens";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params;

  let invite: { email: string; role: "admin" | "professor" | "aluno" } | null =
    null;

  try {
    const db = getDb();
    const [row] = await db
      .select({
        email: invites.email,
        role: invites.role,
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
    invite = row ?? null;
  } catch (error) {
    console.error("[ava-convite] falha ao validar:", error);
  }

  if (!invite) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-lg gap-10 pt-4 sm:pt-10">
      <section className="ava-fade-in space-y-4">
        <p className="ava-kicker">Convite · {roleLabel(invite.role)}</p>
        <h1 className="ava-display text-4xl text-amet-indigo sm:text-5xl">
          Ative sua conta
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-[var(--ava-muted)]">
          Defina nome e senha para entrar no AVA como{" "}
          {roleLabel(invite.role).toLowerCase()}.
        </p>
      </section>

      <div className="ava-fade-in-delay ava-panel">
        <AcceptInviteForm
          token={token}
          email={invite.email}
          roleLabel={roleLabel(invite.role)}
        />
      </div>
    </div>
  );
}
