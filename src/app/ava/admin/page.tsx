import { asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { redirect } from "next/navigation";

import { AdminPanel } from "@/components/ava/AdminPanel";
import { auth } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { classes, invites, subjects, users } from "@/lib/ava/schema";

export default async function AvaAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/ava/login");
  if (session.user.role !== "admin") redirect("/ava");

  const db = getDb();
  const teacher = alias(users, "teacher");

  const [userRows, inviteRows, subjectRows, classRows] = await Promise.all([
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
        subjectId: classes.subjectId,
        subjectName: subjects.name,
        teacherId: classes.teacherId,
        teacherName: teacher.name,
      })
      .from(classes)
      .innerJoin(subjects, eq(subjects.id, classes.subjectId))
      .leftJoin(teacher, eq(teacher.id, classes.teacherId))
      .orderBy(asc(subjects.name), asc(classes.name)),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amet-purple">
          Administração
        </p>
        <h1 className="text-3xl font-semibold text-amet-indigo">Painel AVA</h1>
        <p className="text-amet-indigo/70">
          Convide usuários, organize matérias e turmas, e acompanhe o ambiente.
        </p>
      </div>
      <AdminPanel
        initialUsers={userRows}
        initialInvites={inviteRows.map((invite) => ({
          ...invite,
          expiresAt: invite.expiresAt.toISOString(),
          usedAt: invite.usedAt ? invite.usedAt.toISOString() : null,
        }))}
        initialSubjects={subjectRows}
        initialClasses={classRows}
      />
    </div>
  );
}
