import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/ava/db";
import { canManageClass } from "@/lib/ava/permissions";
import { classes, enrollments, type UserRole } from "@/lib/ava/schema";

export async function userCanAccessClass(params: {
  userId: string;
  role: UserRole;
  classId: string;
}): Promise<{
  allowed: boolean;
  classRow?: typeof classes.$inferSelect;
}> {
  const db = getDb();
  const [classRow] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, params.classId))
    .limit(1);

  if (!classRow) {
    return { allowed: false };
  }

  if (canManageClass(params.role, classRow.teacherId, params.userId)) {
    return { allowed: true, classRow };
  }

  if (params.role === "aluno") {
    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classId, params.classId),
          eq(enrollments.studentId, params.userId),
        ),
      )
      .limit(1);

    if (enrollment) {
      return { allowed: true, classRow };
    }
  }

  return { allowed: false, classRow };
}
