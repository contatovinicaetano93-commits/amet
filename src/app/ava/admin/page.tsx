import { and, asc, count, desc, eq, isNotNull, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { redirect } from "next/navigation";

import { AdminOnboarding } from "@/components/ava/AdminOnboarding";
import { AdminPanel } from "@/components/ava/AdminPanel";
import { OpsSummary } from "@/components/ava/OpsSummary";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { inviteEmailCanDeliverBroadly } from "@/lib/ava/invite-email";
import {
  getOpsSnapshot,
  listOpenDoubts,
  type OpenDoubt,
  type OpsSnapshot,
} from "@/lib/ava/ops";
import {
  classes,
  enrollments,
  invites,
  lessons,
  subjects,
  users,
} from "@/lib/ava/schema";
import { isR2Configured, missingR2EnvKeys } from "@/lib/ava/storage";
import {
  CANONICAL_SUBJECTS,
  ensureCanonicalSubjects,
} from "@/lib/ava/subjects-catalog";

export default async function AvaAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/ava/login");
  if (session.user.role !== "admin") redirect("/ava");

  try {
    await ensureCanonicalSubjects();
  } catch (error) {
    console.error("[ava-admin] ensureCanonicalSubjects failed:", error);
  }

  const db = getDb();
  const teacher = alias(users, "teacher");

  const [
    userRows,
    inviteRows,
    subjectRowsRaw,
    classRows,
    [enrollmentStats],
    [publishedStats],
    [pendingInviteStats],
    [nonBootstrapUsers],
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .orderBy(asc(users.name)),
    db
      .select({
        id: invites.id,
        email: invites.email,
        role: invites.role,
        expiresAt: invites.expiresAt,
        usedAt: invites.usedAt,
      })
      .from(invites)
      .orderBy(desc(invites.createdAt)),
    db.select().from(subjects).orderBy(asc(subjects.name)),
    db
      .select({
        id: classes.id,
        name: classes.name,
        shift: classes.shift,
        subjectId: classes.subjectId,
        subjectName: subjects.name,
        teacherId: classes.teacherId,
        teacherName: teacher.name,
      })
      .from(classes)
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .leftJoin(teacher, eq(teacher.id, classes.teacherId))
      .orderBy(asc(subjects.name), asc(classes.name)),
    db.select({ value: count() }).from(enrollments),
    db
      .select({ value: count() })
      .from(lessons)
      .where(and(eq(lessons.published, 1), isNotNull(lessons.storageKey))),
    db
      .select({ value: count() })
      .from(invites)
      .where(isNull(invites.usedAt)),
    db
      .select({ value: count() })
      .from(users)
      .where(ne(users.email, session.user.email ?? "")),
  ]);

  const firstClassId = classRows[0]?.id ?? null;

  const canonicalOrder = new Map<string, number>(
    CANONICAL_SUBJECTS.map((subject, index) => [subject.slug, index]),
  );
  const subjectRows = [...subjectRowsRaw].sort((a, b) => {
    const ai = canonicalOrder.get(a.slug) ?? 100;
    const bi = canonicalOrder.get(b.slug) ?? 100;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  let snapshot: OpsSnapshot = {
    professors: 0,
    students: 0,
    classes: classRows.length,
    classesWithoutTeacher: classRows.filter((row) => !row.teacherId).length,
    enrollments: enrollmentStats?.value ?? 0,
    publishedLessons: publishedStats?.value ?? 0,
    pendingInvites: pendingInviteStats?.value ?? 0,
    openDoubts: 0,
  };
  let openDoubts: OpenDoubt[] = [];

  try {
    const [ops, doubts] = await Promise.all([
      getOpsSnapshot(),
      listOpenDoubts({ limit: 12 }),
    ]);
    snapshot = ops;
    openDoubts = doubts;
  } catch (error) {
    console.error("[ava-admin] ops snapshot failed:", error);
  }

  return (
    <div className="space-y-10">
      <div className="ava-fade-in space-y-3">
        <p className="ava-kicker">Administração</p>
        <h1 className="ava-display text-3xl text-amet-indigo sm:text-4xl">
          Hoje no AVA AMET
        </h1>
        <p className="max-w-2xl text-[var(--ava-muted)]">
          Convites, turmas, matrículas e acompanhamento da operação.
        </p>
      </div>

      <OpsSummary snapshot={snapshot} openDoubts={openDoubts} />

      <AdminOnboarding
        invitedOrExtraUsers={
          (nonBootstrapUsers?.value ?? 0) > 0 ||
          (pendingInviteStats?.value ?? 0) > 0
        }
        subjectsCount={subjectRows.length}
        classesCount={classRows.length}
        enrollmentsCount={enrollmentStats?.value ?? 0}
        publishedLessonsCount={publishedStats?.value ?? 0}
        firstClassId={firstClassId}
      />

      <AdminPanel
        currentUserId={session.user.id}
        initialUsers={userRows}
        initialInvites={inviteRows.map((invite) => ({
          ...invite,
          expiresAt: invite.expiresAt.toISOString(),
          usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
        }))}
        initialSubjects={subjectRows}
        initialClasses={classRows}
        storageConfigured={isR2Configured()}
        missingStorageKeys={missingR2EnvKeys()}
        emailConfigured={inviteEmailCanDeliverBroadly()}
      />
    </div>
  );
}
