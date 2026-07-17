import { eq } from "drizzle-orm";
import { z } from "zod";

import { userCanAccessClass } from "@/lib/ava/access";
import { askAboutLesson } from "@/lib/ava/ai/ask";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { jsonError, jsonOk, jsonServerError } from "@/lib/ava/http";
import { clientKey, rateLimit } from "@/lib/ava/rate-limit";
import { classes, lessons, subjects } from "@/lib/ava/schema";

const bodySchema = z.object({
  lessonId: z.uuid(),
  question: z.string().trim().min(3).max(1000),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return jsonError("Não autorizado.", { status: 401, event: "ai.unauthorized" });
  }

  const limited = rateLimit({
    key: clientKey(request, `ai-ask:${session.user.id}`),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return jsonError("Limite de perguntas atingido. Tente novamente mais tarde.", {
      status: 429,
      event: "ai.rate_limited",
    });
  }

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError("Dados inválidos.", {
      status: 400,
      details: parsed.error.flatten(),
      event: "ai.invalid_body",
    });
  }

  try {
    const db = getDb();
    const [lesson] = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        classId: lessons.classId,
        className: classes.name,
        subjectName: subjects.name,
        published: lessons.published,
      })
      .from(lessons)
      .innerJoin(classes, eq(classes.id, lessons.classId))
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .where(eq(lessons.id, parsed.data.lessonId))
      .limit(1);

    if (!lesson) {
      return jsonError("Aula não encontrada.", { status: 404 });
    }

    const access = await userCanAccessClass({
      userId: session.user.id,
      role: session.user.role,
      classId: lesson.classId,
    });

    if (!access.allowed) {
      return jsonError("Sem permissão.", { status: 403, event: "ai.forbidden" });
    }

    if (session.user.role === "aluno" && lesson.published !== 1) {
      return jsonError("Aula indisponível.", { status: 404 });
    }

    const result = await askAboutLesson({
      question: parsed.data.question,
      context: {
        lessonTitle: lesson.title,
        lessonDescription: lesson.description,
        className: lesson.className,
        subjectName: lesson.subjectName,
      },
    });

    if (!result.ok) {
      return jsonError(result.error, { status: 400 });
    }

    return jsonOk({
      answer: result.answer,
      provider: result.provider,
    });
  } catch (error) {
    return jsonServerError("ai.ask_route_failed", error);
  }
}
