import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { jsonError, jsonServerError } from "@/lib/ava/http";
import { canManageClass } from "@/lib/ava/permissions";
import { lessonQuestions, lessons, users } from "@/lib/ava/schema";
import { lessonQuestionAnswerSchema } from "@/lib/ava/schemas";

type Params = { params: Promise<{ id: string; questionId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id, questionId } = await params;
    const db = getDb();

    const [lesson] = await db
      .select({
        id: lessons.id,
        classId: lessons.classId,
      })
      .from(lessons)
      .where(eq(lessons.id, id))
      .limit(1);

    if (!lesson) {
      return jsonError("Aula não encontrada.", { status: 404 });
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
      return jsonError("Só o professor/admin pode responder.", { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = lessonQuestionAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Resposta inválida.", {
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const [updated] = await db
      .update(lessonQuestions)
      .set({
        answer: parsed.data.answer,
        answeredById: session.user.id,
        answeredAt: new Date(),
      })
      .where(
        and(
          eq(lessonQuestions.id, questionId),
          eq(lessonQuestions.lessonId, id),
        ),
      )
      .returning({
        id: lessonQuestions.id,
        body: lessonQuestions.body,
        answer: lessonQuestions.answer,
        createdAt: lessonQuestions.createdAt,
        answeredAt: lessonQuestions.answeredAt,
        askerId: lessonQuestions.askerId,
      });

    if (!updated) {
      return jsonError("Pergunta não encontrada.", { status: 404 });
    }

    const [asker] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, updated.askerId))
      .limit(1);

    return NextResponse.json({
      question: {
        id: updated.id,
        body: updated.body,
        answer: updated.answer,
        createdAt: updated.createdAt.toISOString(),
        answeredAt: updated.answeredAt?.toISOString() ?? null,
        askerName: asker?.name ?? "Aluno",
        isMine: updated.askerId === session.user.id,
        answeredByName: session.user.name ?? "Professor",
      },
    });
  } catch (error) {
    return jsonServerError("questions.answer_failed", error);
  }
}
