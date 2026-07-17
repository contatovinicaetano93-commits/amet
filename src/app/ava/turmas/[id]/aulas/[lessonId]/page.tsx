import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LessonPlayer } from "@/components/ava/LessonPlayer";
import { userCanAccessClass } from "@/lib/ava/access";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import { lessonProgress, lessons } from "@/lib/ava/schema";
import { createReadUrl } from "@/lib/ava/storage";

type PageProps = {
  params: Promise<{ id: string; lessonId: string }>;
};

export default async function LessonPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/ava/login");

  const { id, lessonId } = await params;
  const access = await userCanAccessClass({
    userId: session.user.id,
    role: session.user.role,
    classId: id,
  });

  if (!access.allowed || !access.classRow) {
    notFound();
  }

  const db = getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.classId, id)))
    .limit(1);

  if (!lesson) notFound();

  const manage = canManageClass(
    session.user.role,
    access.classRow.teacherId,
    session.user.id,
  );

  if (!manage && (lesson.published !== 1 || !lesson.storageKey)) {
    notFound();
  }

  let videoUrl: string | null = null;
  if (lesson.storageKey) {
    try {
      videoUrl = await createReadUrl(lesson.storageKey);
    } catch (error) {
      console.error("[ava-lesson-page] storage:", error);
    }
  }

  const [progress] = await db
    .select({ id: lessonProgress.id })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.lessonId, lessonId),
        eq(lessonProgress.userId, session.user.id),
      ),
    )
    .limit(1);

  return (
    <div className="space-y-4">
      <Link
        href={`/ava/turmas/${id}`}
        className="text-sm text-amet-blue hover:underline"
      >
        ← Voltar à turma
      </Link>
      <LessonPlayer
        lessonId={lesson.id}
        title={lesson.title}
        description={lesson.description}
        videoUrl={videoUrl}
        initialCompleted={Boolean(progress)}
        canMarkProgress={
          session.user.role === "aluno" || session.user.role === "admin"
        }
      />
    </div>
  );
}
