import { AvaShell } from "@/components/ava/AvaShell";
import { auth } from "@/lib/ava/auth";

export const metadata = {
  title: "AVA AMET | Ambiente Virtual de Aprendizagem",
  description: "Ambiente virtual de aprendizagem da AMET Saúde & Estética.",
};

export default async function AvaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return <AvaShell user={session?.user ?? null}>{children}</AvaShell>;
}
