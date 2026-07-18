"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { loginAction } from "@/app/ava/login/actions";

export function LoginForm() {
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
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {activated ? (
        <p className="border-l-2 border-emerald-600/70 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          Conta ativada
          {activatedRole ? ` como ${activatedRole}` : ""}. Entre com o e-mail e
          a senha que acabou de definir.
        </p>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-amet-indigo">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="ava-input"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-amet-indigo">Senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="ava-input"
        />
      </label>

      {error ? (
        <p className="border-l-2 border-red-600/70 bg-red-50/80 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="ava-btn ava-btn-primary w-full py-3"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
