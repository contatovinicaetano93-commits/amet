"use client";

import { useEffect, useState } from "react";

import { AlunosPanel } from "@/components/admin/AlunosPanel";
import { CandidaturasPanel } from "@/components/admin/CandidaturasPanel";
import { ADMIN_STORAGE_KEY } from "@/lib/adminClient";

type AdminTab = "candidaturas" | "alunos";

function tabLabel(tab: AdminTab): string {
  switch (tab) {
    case "candidaturas":
      return "Candidaturas";
    case "alunos":
      return "Base de alunos";
    default: {
      const exhaustive: never = tab;
      return exhaustive;
    }
  }
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [tab, setTab] = useState<AdminTab>("candidaturas");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) setAdminKey(saved);
  }, []);

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const key = inputKey.trim();
    if (!key) return;
    sessionStorage.setItem(ADMIN_STORAGE_KEY, key);
    setError("");
    setAdminKey(key);
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdminKey("");
    setInputKey("");
    setTab("candidaturas");
  }

  if (!adminKey) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-bold text-amet-indigo">Admin — AMET</h1>
        <p className="mt-2 text-sm text-amet-indigo/70">
          Informe a chave de administrador para gerenciar alunos e candidaturas.
        </p>
        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-amet-indigo">Chave de acesso</span>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-3 text-amet-indigo outline-none focus:border-amet-blue"
              placeholder="Sua chave admin"
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-white hover:bg-amet-indigo"
          >
            Entrar
          </button>
        </form>
        <p className="mt-6 text-xs text-amet-indigo/70">
          Padrão local: <code className="rounded bg-amet-blue/5 px-1">amet-admin</code> — altere com{" "}
          <code className="rounded bg-amet-blue/5 px-1">ADMIN_KEY</code> no ambiente.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amet-indigo">Painel administrativo</h1>
          <p className="mt-1 text-sm text-amet-indigo/70">
            Gerencie a base de alunos AMET e as candidaturas de estágio.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-amet-purple/20 px-4 py-2 text-sm font-medium text-amet-purple hover:bg-amet-purple/5"
        >
          Sair
        </button>
      </div>

      <div className="mt-8 flex gap-2 border-b border-amet-blue/15 pb-px">
        {(["candidaturas", "alunos"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-t-xl px-4 py-2 text-sm font-medium ${
              tab === item
                ? "border border-b-white border-amet-blue/15 bg-white text-amet-blue"
                : "text-amet-indigo/70 hover:text-amet-blue"
            }`}
          >
            {tabLabel(item)}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "candidaturas" ? (
          <CandidaturasPanel adminKey={adminKey} />
        ) : (
          <AlunosPanel adminKey={adminKey} />
        )}
      </div>
    </main>
  );
}
