import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/ava/LoginForm";
import { auth } from "@/lib/ava/auth";

export default async function AvaLoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/ava");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amet-purple">
          AVA AMET
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-amet-indigo">
          Entrar
        </h1>
        <p className="text-amet-indigo/70">
          Acesso por convite. Use o e-mail e a senha definidos no convite.
        </p>
      </div>

      <div className="rounded-lg border border-amet-indigo/10 bg-white/90 p-6 shadow-[0_20px_50px_-35px_rgba(28,36,147,0.45)]">
        <Suspense fallback={<p className="text-sm text-amet-indigo/60">Carregando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
