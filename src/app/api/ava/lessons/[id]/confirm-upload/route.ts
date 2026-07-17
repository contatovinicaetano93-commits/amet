import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import { lessons } from "@/lib/ava/schema";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const publish = Boolean(body?.publish);

  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) {
    return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });
  }

  if (!lesson.storageKey) {
    return NextResponse.json(
      { error: "Nenhum vídeo associado a esta aula." },
      { status: 400 },
    );
  }

  const access = await userCanAccessClass({
    userId: session.user.id,
    role: session.user.role,
    classId: lesson.classId,
  });

  if (
    !access.classRow ||
    !canManageClass(
      session.user.role,
      access.classRow.teacherId,
      session.user.id,
    )
  ) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const [updated] = await db
    .update(lessons)
    .set({ published: publish ? 1 : lesson.published })
    .where(eq(lessons.id, id))
    .returning();

  return NextResponse.json({
    lesson: {
      ...updated,
      published: updated.published === 1,
      hasVideo: Boolean(updated.storageKey),
    },
  });
}
