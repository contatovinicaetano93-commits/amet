import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/ava/LoginForm";
import { auth } from "@/lib/ava/auth";
import { homePathForRole } from "@/lib/ava/navigation";

export default async function AvaLoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(homePathForRole(session.user.role));
  }

  return (
    <div className="mx-auto grid max-w-lg gap-10 pt-4 sm:pt-10">
      <section className="ava-fade-in space-y-4">
        <p className="ava-kicker">Ambiente virtual</p>
        <h1 className="ava-display text-4xl text-amet-indigo sm:text-5xl">
          AMET
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-[var(--ava-muted)]">
          Entre com o e-mail e a senha do seu convite para continuar os estudos.
        </p>
      </section>

      <div className="ava-fade-in-delay ava-panel">
        <Suspense
          fallback={
            <p className="text-sm text-[var(--ava-muted)]">Carregando…</p>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
