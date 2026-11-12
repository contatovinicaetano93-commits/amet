import { redirect } from "next/navigation";

import { hasAdminSession } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export default async function AcademicoLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) redirect("/admin");
  return children;
}
