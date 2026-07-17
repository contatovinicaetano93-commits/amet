import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/ava/auth";
import { getDb } from "@/lib/ava/db";
import { users } from "@/lib/ava/schema";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name));

  return NextResponse.json({ users: rows });
}
