import { signOut } from "@/lib/ava/auth";

export async function POST() {
  await signOut({ redirectTo: "/ava/login" });
}
