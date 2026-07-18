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
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1 text-sm text-[var(--ava-muted)]">
        <p>
          E-mail: <span className="font-medium text-amet-indigo">{email}</span>
        </p>
        <p>
          Perfil:{" "}
          <span className="font-medium text-amet-indigo">{roleLabel}</span>
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-amet-indigo">
          Nome completo
        </span>
        <input name="name" required minLength={2} className="ava-input" />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-amet-indigo">Senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="ava-input"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-amet-indigo">
          Confirmar senha
        </span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          className="ava-input"
        />
      </label>

      {error ? (
        <p className="border-l-2 border-red-700/60 bg-red-50/80 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="ava-btn ava-btn-primary w-full py-3"
      >
        {pending ? "Ativando…" : `Ativar conta de ${roleLabel}`}
      </button>
    </form>
  );
}
