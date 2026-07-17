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
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amet-purple">
          Convite AVA
        </p>
        <h1 className="text-3xl font-semibold text-amet-indigo">
          Ative sua conta
        </h1>
        <p className="text-amet-indigo/70">
          Defina seu nome e senha para começar a usar o ambiente virtual.
        </p>
      </div>

      <div className="rounded-lg border border-amet-indigo/10 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(28,36,147,0.45)]">
        <AcceptInviteForm
          token={token}
          email={invite.email}
          roleLabel={roleLabel(invite.role)}
        />
      </div>
    </div>
  );
}
