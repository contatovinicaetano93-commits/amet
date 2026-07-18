"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { loginAction } from "@/app/ava/login/actions";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const activated = searchParams.get("activated") === "1";
  const activatedRole = searchParams.get("role");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const callbackUrl = searchParams.get("callbackUrl") || "/ava";

    startTransition(async () => {
      const result = await loginAction(form, callbackUrl);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.replace(result.redirectTo ?? "/ava");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {activated ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Conta ativada
          {activatedRole ? ` como ${activatedRole}` : ""}. Entre com o e-mail e
          a senha que acabou de definir.
        </p>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-amet-indigo">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-amet-indigo/15 bg-white px-3 py-2 outline-none ring-amet-blue/30 focus:ring-2"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-amet-indigo">Senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="w-full rounded-md border border-amet-indigo/15 bg-white px-3 py-2 outline-none ring-amet-blue/30 focus:ring-2"
        />
      </label>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-amet-indigo px-4 py-2.5 font-semibold text-white transition hover:bg-amet-blue disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
