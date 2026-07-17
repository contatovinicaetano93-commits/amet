import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { userCanAccessClass } from "@/lib/ava/access";
import { requireSession } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import { lessons } from "@/lib/ava/schema";
import { uploadIntentSchema } from "@/lib/ava/schemas";
import { captureAvaException, errorMessage } from "@/lib/ava/observability";
import {
  buildLessonStorageKey,
  createUploadUrl,
  extensionForContentType,
  isR2Configured,
  missingR2EnvKeys,
} from "@/lib/ava/storage";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = uploadIntentSchema.safeParse({ ...body, lessonId: id });
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

  const extension = extensionForContentType(parsed.data.contentType);
  const storageKey = buildLessonStorageKey(
    lesson.classId,
    lesson.id,
    extension,
  );

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error: `Cloudflare R2 não configurado. Faltam: ${missingR2EnvKeys().join(", ")}`,
        missing: missingR2EnvKeys(),
      },
      { status: 503 },
    );
  }

  let uploadUrl: string;
  try {
    uploadUrl = await createUploadUrl({
      storageKey,
      contentType: parsed.data.contentType,
      contentLength: parsed.data.contentLength,
    });
  } catch (error) {
    captureAvaException(error, { event: "upload.presign_failed", lessonId: id });
    return NextResponse.json(
      {
        error:
          errorMessage(error) ||
          "Não foi possível preparar o upload. Verifique o R2 e o CORS do bucket.",
      },
      { status: 503 },
    );
  }

  await db
    .update(lessons)
    .set({
      storageKey,
      contentType: parsed.data.contentType,
      sizeBytes: parsed.data.contentLength,
      published: 0,
    })
    .where(eq(lessons.id, id));

  return NextResponse.json({
    uploadUrl,
    storageKey,
    headers: {
      "Content-Type": parsed.data.contentType,
    },
  });
}
