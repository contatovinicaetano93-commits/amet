"use client";

import { useEffect, useState } from "react";

import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { AdminSectionNav } from "@/components/admin/AdminSectionNav";
import { AlunosPanel } from "@/components/admin/AlunosPanel";
import { CandidaturasPanel } from "@/components/admin/CandidaturasPanel";

type AdminTab = "inscricoes" | "alunos";

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<AdminTab>("inscricoes");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const aba = new URLSearchParams(window.location.search).get("aba");
    if (aba === "alunos" || aba === "inscricoes") setTab(aba);
    void fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => setAuthed(response.ok))
      .finally(() => setReady(true));
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "E-mail ou senha incorretos.");
        return;
      }
      setPassword("");
      setAuthed(true);
    } catch {
      setError("Não foi possível entrar. Tente de novo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-16">
        <p className="text-sm text-amet-indigo/70">Abrindo o acesso...</p>
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-bold text-amet-indigo">Admin — AMET</h1>
        <p className="mt-2 text-sm text-amet-indigo/70">
          Entre com o e-mail e a senha do admin para conferir as inscrições de estágio, o ERP e as aulas online.
        </p>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-amet-indigo">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-3 text-amet-indigo outline-none focus:border-amet-blue"
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-amet-indigo">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-3 text-amet-indigo outline-none focus:border-amet-blue"
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-white hover:bg-amet-indigo disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amet-indigo">Painel administrativo</h1>
          <p className="mt-1 text-sm text-amet-indigo/70">
            As inscrições de estágio ficam só neste acesso, junto com o ERP e a orquestração das aulas.
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <AdminSectionNav current={tab} />

      <div className="mt-8">
        {tab === "inscricoes" ? <CandidaturasPanel adminKey="" /> : <AlunosPanel adminKey="" />}
      </div>
    </main>
  );
}
