import { eq } from "drizzle-orm";

import { getDb } from "@/lib/ava/db";
import { hashPassword } from "@/lib/ava/password";
import { users } from "@/lib/ava/schema";

/** Cria o primeiro admin a partir de env, se ainda não houver nenhum. */
export async function ensureBootstrapAdmin(): Promise<void> {
  const email = process.env.AVA_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.AVA_BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) return;

  const db = getDb();
  const existingAdmins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);

  if (existingAdmins.length > 0) return;

  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) return;

  await db.insert(users).values({
    name: "Administrador AMET",
    email,
    passwordHash: await hashPassword(password),
    role: "admin",
  });
}
