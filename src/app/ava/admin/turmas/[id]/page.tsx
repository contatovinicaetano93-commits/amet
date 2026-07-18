import { redirect } from "next/navigation";

import { classManagePath } from "@/lib/ava/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy admin URL — keep working, point to the shared manage surface. */
export default async function AdminClassRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(classManagePath(id));
}
