"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AcceptInviteFormProps = {
  token: string;
  email: string;
  roleLabel: string;
};

export function AcceptInviteForm({
  token,
  email,
  roleLabel,
}: AcceptInviteFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/ava/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possível ativar o convite.");
        return;
      }

      const role = encodeURIComponent(roleLabel);
      router.replace(`/ava/login?activated=1&role=${role}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-md bg-amet-indigo/5 px-3 py-2 text-sm text-amet-indigo/80">
        <p>
          E-mail: <strong>{email}</strong>
        </p>
        <p>
          Perfil: <strong>{roleLabel}</strong>
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nome completo</span>
        <input
          name="name"
          required
          minLength={2}
          className="w-full rounded-md border border-amet-indigo/15 bg-white px-3 py-2 outline-none ring-amet-blue/30 focus:ring-2"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border border-amet-indigo/15 bg-white px-3 py-2 outline-none ring-amet-blue/30 focus:ring-2"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Confirmar senha</span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
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
        {pending ? "Ativando…" : `Ativar conta de ${roleLabel}`}
      </button>
    </form>
  );
}
