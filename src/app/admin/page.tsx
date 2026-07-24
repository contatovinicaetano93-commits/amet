"use client";

import { useCallback, useEffect, useState } from "react";

import { AREAS, DIAS, PERIODOS, UNIDADES } from "@/lib/constants";
import type { CandidaturaRecord } from "@/lib/db";
import { isAluno } from "@/lib/schemas";
import {
  buildCandidaturasXlsxFilename,
  forceXlsxFilename,
  isXlsxBuffer,
  XLSX_MIME,
} from "@/lib/xlsxDownload";

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

function labelPeriodo(code: string) {
  return PERIODOS.find((p) => p.code === code)?.label ?? code;
}

function labelDias(codes: string[]) {
  return codes.map((code) => DIAS.find((d) => d.code === code)?.label ?? code).join(", ");
}

function buildWhatsAppLink(telefone: string, nomeCompleto: string): string {
  let digits = telefone.replace(/\D/g, "");
  if (!digits.startsWith("55")) digits = `55${digits}`;
  const firstName = nomeCompleto.trim().split(/\s+/)[0] || "";
  const text = firstName
    ? `Olá ${firstName}, tudo bem? Aqui é da AMET Saúde & Estética.`
    : "Olá, tudo bem? Aqui é da AMET Saúde & Estética.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [candidaturas, setCandidaturas] = useState<CandidaturaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  async function handleExport() {
    setExporting(true);
    setError("");
    try {
      const response = await fetch("/api/candidaturas/export?format=xlsx", {
        headers: {
          "x-admin-key": adminKey,
          Accept: XLSX_MIME,
        },
        cache: "no-store",
      });
      if (!response.ok) {
        setError("Não foi possível gerar a planilha.");
        return;
      }

      const buffer = await response.arrayBuffer();
      if (!isXlsxBuffer(buffer)) {
        setError(
          "A planilha gerada é inválida. Atualize a página (Ctrl+F5) e tente de novo.",
        );
        return;
      }

      // Force XLSX MIME + filename. Some browsers rename by Blob type / old
      // Content-Disposition and would save real Excel bytes as ".csv".
      const filename = forceXlsxFilename(buildCandidaturasXlsxFilename());
      const blob = new Blob([buffer], { type: XLSX_MIME });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setExporting(false);
    }
  }

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
          <h1 className="text-2xl font-bold text-amet-indigo">Candidaturas recebidas</h1>
          <p className="mt-1 text-sm text-amet-indigo/70">{candidaturas.length} registro(s)</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
            onClick={() => void handleExport()}
            disabled={exporting || candidaturas.length === 0}
            className="rounded-full bg-amet-blue px-4 py-2 text-sm font-medium text-white hover:bg-amet-indigo disabled:opacity-50"
          >
            {exporting ? "Gerando…" : "Baixar Excel (.xlsx)"}
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
                <p className="text-xs text-amet-indigo/70">
                  {formatDate(item.createdAt)} · {item.tipoPerfil === "aluno" ? "Aluno" : "Não aluno"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amet-blue/10 px-3 py-1 text-xs font-medium text-amet-blue">
                  RGM {item.rgm}
                </span>
                {!item.emailSent && (
                  <span
                    className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                    title={item.emailError ?? "Falha ao enviar notificação por e-mail"}
                  >
                    E-mail não enviado
                  </span>
                )}
                <a
                  href={buildWhatsAppLink(item.telefone, item.nomeCompleto)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                >
                  WhatsApp
                </a>
              </div>
            </div>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">CPF</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{item.cpf}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">Telefone</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{item.telefone}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">E-mail</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{item.email}</dd>
              </div>
              {isAluno(item) && (
                <>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">Unidade</dt>
                    <dd className="mt-1 text-sm text-amet-indigo">{labelUnidade(item.unidade)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">
                      Área de estágio
                    </dt>
                    <dd className="mt-1 text-sm text-amet-indigo">{labelArea(item.area)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">Turno</dt>
                    <dd className="mt-1 text-sm text-amet-indigo">{labelPeriodo(item.periodo)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">Dias</dt>
                    <dd className="mt-1 text-sm text-amet-indigo">{labelDias(item.dias)}</dd>
                  </div>
                </>
              )}
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
