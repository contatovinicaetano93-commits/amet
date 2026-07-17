import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { lessonProgress, lessons } from "@/lib/ava/schema";
import { progressSchema } from "@/lib/ava/schemas";

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = progressSchema.safeParse(body);
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
    .where(eq(lessons.id, parsed.data.lessonId))
    .limit(1);

  if (!lesson || lesson.published !== 1 || !lesson.storageKey) {
    return NextResponse.json({ error: "Aula indisponível." }, { status: 404 });
  }

  const access = await userCanAccessClass({
    userId: session.user.id,
    role: session.user.role,
    classId: lesson.classId,
  });

  if (!access.allowed) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  if (session.user.role !== "aluno" && session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas alunos registram progresso." },
      { status: 403 },
    );
  }

  if (!parsed.data.completed) {
    await db
      .delete(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, session.user.id),
          eq(lessonProgress.lessonId, parsed.data.lessonId),
        ),
      );
    return NextResponse.json({ completed: false });
  }

  const [existing] = await db
    .select({ id: lessonProgress.id })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, session.user.id),
        eq(lessonProgress.lessonId, parsed.data.lessonId),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(lessonProgress).values({
      userId: session.user.id,
      lessonId: parsed.data.lessonId,
    });
  }

  return NextResponse.json({ completed: true });
}
