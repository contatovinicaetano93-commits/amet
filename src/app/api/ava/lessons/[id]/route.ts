import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import { lessonProgress, lessons } from "@/lib/ava/schema";
import { lessonUpdateSchema } from "@/lib/ava/schemas";
import { createReadUrl } from "@/lib/ava/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) {
    return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });
  }

  const access = await userCanAccessClass({
    userId: session.user.id,
    role: session.user.role,
    classId: lesson.classId,
  });

  if (!access.allowed || !access.classRow) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const manage = canManageClass(
    session.user.role,
    access.classRow.teacherId,
    session.user.id,
  );

  if (!manage && (lesson.published !== 1 || !lesson.storageKey)) {
    return NextResponse.json({ error: "Aula indisponível." }, { status: 404 });
  }

  let videoUrl: string | null = null;
  if (lesson.storageKey) {
    try {
      videoUrl = await createReadUrl(lesson.storageKey);
    } catch (error) {
      console.error("[ava-lessons] falha ao assinar URL:", error);
      return NextResponse.json(
        { error: "Storage de vídeo não configurado." },
        { status: 503 },
      );
    }
  }

  const [userProgress] = await db
    .select({ id: lessonProgress.id })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.lessonId, id),
        eq(lessonProgress.userId, session.user.id),
      ),
    )
    .limit(1);

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      classId: lesson.classId,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      published: lesson.published === 1,
      hasVideo: Boolean(lesson.storageKey),
      contentType: lesson.contentType,
    },
    videoUrl,
    completed: Boolean(userProgress),
    canManage: manage,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = lessonUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) {
    return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });
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
    .set({
      title: parsed.data.title ?? lesson.title,
      description:
        parsed.data.description === undefined
          ? lesson.description
          : parsed.data.description,
      order: parsed.data.order ?? lesson.order,
      published:
        parsed.data.published === undefined
          ? lesson.published
          : parsed.data.published
            ? 1
            : 0,
    })
    .where(eq(lessons.id, id))
    .returning();

  return NextResponse.json({ lesson: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);

  if (!lesson) {
    return NextResponse.json({ error: "Aula não encontrada." }, { status: 404 });
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

  await db.delete(lessons).where(eq(lessons.id, id));
  return NextResponse.json({ ok: true });
}
