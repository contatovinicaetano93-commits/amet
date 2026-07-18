import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { jsonError, jsonServerError } from "@/lib/ava/http";
import { canManageClass } from "@/lib/ava/permissions";
import { clientKey, rateLimit } from "@/lib/ava/rate-limit";
import { lessonQuestions, lessons, users } from "@/lib/ava/schema";
import { lessonQuestionCreateSchema } from "@/lib/ava/schemas";

type Params = { params: Promise<{ id: string }> };

async function loadLessonAccess(lessonId: string, session: {
  user: { id: string; role: "admin" | "professor" | "aluno" };
}) {
  const db = getDb();
  const [lesson] = await db
    .select({
      id: lessons.id,
      classId: lessons.classId,
      published: lessons.published,
    })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (!lesson) return null;

  const access = await userCanAccessClass({
    userId: session.user.id,
    role: session.user.role,
    classId: lesson.classId,
  });

  if (!access.allowed || !access.classRow) return null;

  const manage = canManageClass(
    session.user.role,
    access.classRow.teacherId,
    session.user.id,
  );

  if (!manage && lesson.published !== 1) return null;

  return { lesson, manage };
}

export async function GET(_request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const ctx = await loadLessonAccess(id, session);
    if (!ctx) {
      return jsonError("Aula indisponível.", { status: 404 });
    }

    const db = getDb();
    const asker = alias(users, "asker");
    const answerer = alias(users, "answerer");

    const rows = await db
      .select({
        id: lessonQuestions.id,
        body: lessonQuestions.body,
        answer: lessonQuestions.answer,
        createdAt: lessonQuestions.createdAt,
        answeredAt: lessonQuestions.answeredAt,
        askerId: lessonQuestions.askerId,
        askerName: asker.name,
        answeredByName: answerer.name,
      })
      .from(lessonQuestions)
      .innerJoin(asker, eq(asker.id, lessonQuestions.askerId))
      .leftJoin(answerer, eq(answerer.id, lessonQuestions.answeredById))
      .where(eq(lessonQuestions.lessonId, id))
      .orderBy(desc(lessonQuestions.createdAt));

    return NextResponse.json({
      canAsk: session.user.role === "aluno",
      canAnswer: ctx.manage,
      questions: rows.map((row) => ({
        id: row.id,
        body: row.body,
        answer: row.answer,
        createdAt: row.createdAt.toISOString(),
        answeredAt: row.answeredAt ? row.answeredAt.toISOString() : null,
        askerName: row.askerName,
        isMine: row.askerId === session.user.id,
        answeredByName: row.answeredByName,
      })),
    });
  } catch (error) {
    return jsonServerError("questions.list_failed", error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const limited = await rateLimit({
      key: clientKey(request, `question:${session.user.id}`),
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return jsonError("Muitas perguntas. Aguarde e tente de novo.", {
        status: 429,
        event: "questions.rate_limited",
      });
    }

    const { id } = await params;
    const ctx = await loadLessonAccess(id, session);
    if (!ctx) {
      return jsonError("Aula indisponível.", { status: 404 });
    }

    if (session.user.role !== "aluno") {
      return jsonError("Só alunos podem perguntar ao professor.", {
        status: 403,
      });
    }

    const body = await request.json().catch(() => null);
    const parsed = lessonQuestionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Pergunta inválida.", {
        status: 400,
        details: parsed.error.flatten(),
      });
    }

    const db = getDb();
    const [created] = await db
      .insert(lessonQuestions)
      .values({
        lessonId: id,
        askerId: session.user.id,
        body: parsed.data.body,
      })
      .returning({
        id: lessonQuestions.id,
        body: lessonQuestions.body,
        createdAt: lessonQuestions.createdAt,
      });

    return NextResponse.json(
      {
        question: {
          id: created.id,
          body: created.body,
          answer: null,
          createdAt: created.createdAt.toISOString(),
          answeredAt: null,
          askerName: session.user.name ?? "Você",
          isMine: true,
          answeredByName: null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonServerError("questions.create_failed", error);
  }
}
