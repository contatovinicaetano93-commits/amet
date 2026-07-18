import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import { lessons } from "@/lib/ava/schema";
import { objectExists } from "@/lib/ava/storage";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const publish = Boolean(
    body &&
      (body.publish === true ||
        body.published === true ||
        body.publish === 1 ||
        body.published === 1),
  );

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

  const exists = await objectExists(lesson.storageKey);
  if (!exists) {
    await db
      .update(lessons)
      .set({ published: 0, storageKey: null, contentType: null, sizeBytes: null })
      .where(eq(lessons.id, id));
    return NextResponse.json(
      {
        error:
          "O vídeo não chegou ao storage (CORS/upload). Envie o arquivo de novo.",
      },
      { status: 409 },
    );
  }

  const [updated] = await db
    .update(lessons)
    .set({ published: publish ? 1 : 0 })
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
