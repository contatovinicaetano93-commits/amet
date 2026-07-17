"use client";

import { useCallback, useEffect, useState } from "react";

import { AREAS, CURSOS, UNIDADES } from "@/lib/constants";
import type { CandidaturaRecord } from "@/lib/db";

const STORAGE_KEY = "amet-admin-key";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}

function labelUnidade(code: string) {
  return UNIDADES.find((u) => u.code === code)?.label ?? code;
}

function labelArea(code: string) {
  return AREAS[code as keyof typeof AREAS]?.label ?? code;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [candidaturas, setCandidaturas] = useState<CandidaturaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setAdminKey(saved);
  }, []);

  const fetchCandidaturas = useCallback(async (key: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/candidaturas", {
        headers: { "x-admin-key": key },
        cache: "no-store",
      });
      if (!response.ok) {
        setError(response.status === 401 ? "Chave de acesso inválida." : "Erro ao carregar candidaturas.");
        setCandidaturas([]);
        return;
      }
      const data = (await response.json()) as { candidaturas: CandidaturaRecord[] };
      setCandidaturas(data.candidaturas);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminKey) void fetchCandidaturas(adminKey);
  }, [adminKey, fetchCandidaturas]);

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    const key = inputKey.trim();
    if (!key) return;
    sessionStorage.setItem(STORAGE_KEY, key);
    setAdminKey(key);
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setAdminKey("");
    setInputKey("");
    setCandidaturas([]);
  }

  if (!adminKey) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-bold text-amet-indigo">Admin — Candidaturas</h1>
        <p className="mt-2 text-sm text-amet-indigo/70">
          Informe a chave de administrador para visualizar as inscrições.
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-white hover:bg-amet-indigo"
          >
            Entrar
          </button>
        </form>
        <p className="mt-6 text-xs text-amet-indigo/50">
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
          <h1 className="text-2xl font-bold text-amet-indigo">Candidaturas recebidas</h1>
          <p className="mt-1 text-sm text-amet-indigo/70">{candidaturas.length} registro(s)</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void fetchCandidaturas(adminKey)}
            disabled={loading}
            className="rounded-full border border-amet-blue/20 px-4 py-2 text-sm font-medium text-amet-blue hover:bg-amet-blue/5 disabled:opacity-50"
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-amet-purple/20 px-4 py-2 text-sm font-medium text-amet-purple hover:bg-amet-purple/5"
          >
            Sair
          </button>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <div className="mt-8 space-y-6">
        {candidaturas.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-amet-blue/15 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amet-blue/10 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-amet-indigo">{item.nomeCompleto}</h2>
                <p className="text-xs text-amet-indigo/50">
                  {formatDate(item.createdAt)} · {item.tipoPerfil === "aluno" ? "Aluno" : "Não aluno"}
                </p>
              </div>
              <span className="rounded-full bg-amet-blue/10 px-3 py-1 text-xs font-medium text-amet-blue">
                RGM {item.rgm}
              </span>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/50">CPF</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{item.cpf}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/50">Telefone</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{item.telefone}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/50">E-mail</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{item.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/50">Unidade(s)</dt>
                <dd className="mt-1 text-sm text-amet-indigo">
                  {item.unidades.map(labelUnidade).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/50">Curso</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{item.cursoAtual}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/50">
                  Área(s) de interesse
                </dt>
                <dd className="mt-1 text-sm text-amet-indigo">
                  {item.areasInteresse.map(labelArea).join(", ")}
                </dd>
              </div>
            </dl>
          </article>
        ))}

        {!loading && candidaturas.length === 0 && !error && (
          <p className="rounded-2xl border border-dashed border-amet-blue/20 p-12 text-center text-sm text-amet-indigo/60">
            Nenhuma candidatura registrada ainda.
          </p>
        )}
      </div>
    </main>
  );
}
