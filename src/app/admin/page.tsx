"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
  useSyncExternalStore,
  startTransition,
} from "react";

import { AREAS, DIAS, PERIODOS, UNIDADES } from "@/lib/constants";
import type { CandidaturaRecord, ParticipanteRecord } from "@/lib/db";
import { isAluno } from "@/lib/schemas";
import { formatCpf, stripDigits } from "@/lib/validators";
import {
  buildCandidaturasXlsxFilename,
  forceXlsxFilename,
  isXlsxBuffer,
  XLSX_MIME,
} from "@/lib/xlsxDownload";

const STORAGE_KEY = "amet-admin-key";
const PARTICIPANTES_PAGE_SIZE = 100;

type AdminTab = "candidaturas" | "alunos";

const adminKeyListeners = new Set<() => void>();

function subscribeAdminKey(onStoreChange: () => void) {
  adminKeyListeners.add(onStoreChange);
  return () => {
    adminKeyListeners.delete(onStoreChange);
  };
}

function getAdminKeySnapshot() {
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerAdminKeySnapshot() {
  return "";
}

function writeAdminKey(key: string) {
  if (key) sessionStorage.setItem(STORAGE_KEY, key);
  else sessionStorage.removeItem(STORAGE_KEY);
  for (const listener of adminKeyListeners) listener();
}

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
  const adminKey = useSyncExternalStore(
    subscribeAdminKey,
    getAdminKeySnapshot,
    getServerAdminKeySnapshot,
  );
  const [inputKey, setInputKey] = useState("");
  const [tab, setTab] = useState<AdminTab>("candidaturas");
  const [candidaturas, setCandidaturas] = useState<CandidaturaRecord[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteRecord[]>([]);
  const [participantesTotal, setParticipantesTotal] = useState(0);
  const [alunoQuery, setAlunoQuery] = useState("");
  const deferredAlunoQuery = useDeferredValue(alunoQuery);
  const [newAlunoCpf, setNewAlunoCpf] = useState("");
  const [newAlunoNome, setNewAlunoNome] = useState("");
  const [editingCpf, setEditingCpf] = useState<string | null>(null);
  const [editCpfValue, setEditCpfValue] = useState("");
  const [editNomeValue, setEditNomeValue] = useState("");
  const [loadingCandidaturas, setLoadingCandidaturas] = useState(false);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savingAluno, setSavingAluno] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const loading = tab === "candidaturas" ? loadingCandidaturas : loadingParticipantes;

  const fetchCandidaturas = useCallback(async (key: string) => {
    startTransition(() => {
      setLoadingCandidaturas(true);
      setError("");
    });
    try {
      const response = await fetch("/api/candidaturas", {
        headers: { "x-admin-key": key },
        cache: "no-store",
      });
      if (!response.ok) {
        startTransition(() => {
          setError(
            response.status === 401 ? "Chave de acesso inválida." : "Erro ao carregar candidaturas.",
          );
          setCandidaturas([]);
        });
        return;
      }
      const data = (await response.json()) as { candidaturas: CandidaturaRecord[] };
      startTransition(() => {
        setCandidaturas(data.candidaturas);
      });
    } catch {
      startTransition(() => {
        setError("Não foi possível conectar ao servidor.");
      });
    } finally {
      startTransition(() => {
        setLoadingCandidaturas(false);
      });
    }
  }, []);

  const fetchParticipantes = useCallback(async (key: string, q: string, offset = 0) => {
    startTransition(() => {
      setLoadingParticipantes(true);
      setError("");
    });
    try {
      const params = new URLSearchParams({
        limit: String(PARTICIPANTES_PAGE_SIZE),
        offset: String(offset),
      });
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch(`/api/participantes?${params}`, {
        headers: { "x-admin-key": key },
        cache: "no-store",
      });
      if (!response.ok) {
        startTransition(() => {
          setError(
            response.status === 401
              ? "Chave de acesso inválida."
              : "Erro ao carregar base de alunos.",
          );
          if (offset === 0) {
            setParticipantes([]);
            setParticipantesTotal(0);
          }
        });
        return;
      }
      const data = (await response.json()) as {
        participantes: ParticipanteRecord[];
        total: number;
      };
      startTransition(() => {
        setParticipantes((prev) =>
          offset === 0 ? data.participantes : [...prev, ...data.participantes],
        );
        setParticipantesTotal(data.total);
      });
    } catch {
      startTransition(() => {
        setError("Não foi possível conectar ao servidor.");
      });
    } finally {
      startTransition(() => {
        setLoadingParticipantes(false);
      });
    }
  }, []);

  useEffect(() => {
    if (!adminKey) return;
    if (tab === "candidaturas") {
      void fetchCandidaturas(adminKey);
      return;
    }
    void fetchParticipantes(adminKey, deferredAlunoQuery, 0);
  }, [adminKey, tab, deferredAlunoQuery, fetchCandidaturas, fetchParticipantes]);

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
    writeAdminKey(key);
  }

  function handleLogout() {
    writeAdminKey("");
    setInputKey("");
    setCandidaturas([]);
    setParticipantes([]);
    setParticipantesTotal(0);
    setEditingCpf(null);
    setNotice("");
    setError("");
  }

  async function handleAddAluno(event: React.FormEvent) {
    event.preventDefault();
    setSavingAluno(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/participantes", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          cpf: stripDigits(newAlunoCpf),
          nome: newAlunoNome.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível incluir o aluno.");
        return;
      }
      setNewAlunoCpf("");
      setNewAlunoNome("");
      setNotice("Aluno incluído na base.");
      await fetchParticipantes(adminKey, alunoQuery);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSavingAluno(false);
    }
  }

  function startEdit(item: ParticipanteRecord) {
    setEditingCpf(item.cpf);
    setEditCpfValue(formatCpf(item.cpf));
    setEditNomeValue(item.nome);
    setNotice("");
    setError("");
  }

  function cancelEdit() {
    setEditingCpf(null);
    setEditCpfValue("");
    setEditNomeValue("");
  }

  async function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editingCpf) return;
    setSavingAluno(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/participantes", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          cpf: editingCpf,
          newCpf: stripDigits(editCpfValue),
          nome: editNomeValue.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar a alteração.");
        return;
      }
      cancelEdit();
      setNotice("Aluno atualizado.");
      await fetchParticipantes(adminKey, alunoQuery);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSavingAluno(false);
    }
  }

  async function handleDeleteAluno(cpf: string, nome: string) {
    const label = nome ? `${nome} (${formatCpf(cpf)})` : formatCpf(cpf);
    if (!window.confirm(`Remover ${label} da base de alunos?`)) return;
    setSavingAluno(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/participantes", {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ cpfs: [cpf] }),
      });
      const data = (await response.json()) as { error?: string; deleted?: number };
      if (!response.ok) {
        setError(data.error ?? "Não foi possível excluir o aluno.");
        return;
      }
      if (editingCpf === cpf) cancelEdit();
      setNotice(data.deleted ? "Aluno removido da base." : "Nenhum aluno removido.");
      await fetchParticipantes(adminKey, alunoQuery);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSavingAluno(false);
    }
  }

  if (!adminKey) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
        <h1 className="text-2xl font-bold text-amet-indigo">Admin — AMET</h1>
        <p className="mt-2 text-sm text-amet-indigo/70">
          Informe a chave de administrador para gerenciar candidaturas e a base de alunos.
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
          <h1 className="text-2xl font-bold text-amet-indigo">Painel administrativo</h1>
          <p className="mt-1 text-sm text-amet-indigo/70">
            {tab === "candidaturas"
              ? `${candidaturas.length} candidatura(s)`
              : `${participantesTotal} aluno(s) na base`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {tab === "candidaturas" && (
            <>
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
            </>
          )}
          {tab === "alunos" && (
            <button
              type="button"
              onClick={() => void fetchParticipantes(adminKey, alunoQuery)}
              disabled={loading}
              className="rounded-full border border-amet-blue/20 px-4 py-2 text-sm font-medium text-amet-blue hover:bg-amet-blue/5 disabled:opacity-50"
            >
              {loading ? "Atualizando…" : "Atualizar"}
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-amet-purple/20 px-4 py-2 text-sm font-medium text-amet-purple hover:bg-amet-purple/5"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-b border-amet-blue/10 pb-1">
        <button
          type="button"
          onClick={() => {
            setTab("candidaturas");
            setNotice("");
            setError("");
          }}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            tab === "candidaturas"
              ? "bg-amet-blue/10 text-amet-blue"
              : "text-amet-indigo/60 hover:text-amet-blue"
          }`}
        >
          Candidaturas
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("alunos");
            setNotice("");
            setError("");
          }}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            tab === "alunos"
              ? "bg-amet-blue/10 text-amet-blue"
              : "text-amet-indigo/60 hover:text-amet-blue"
          }`}
        >
          Base de alunos
        </button>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-6 text-sm text-green-700">{notice}</p>}

      {tab === "candidaturas" ? (
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
      ) : (
        <div className="mt-8 space-y-8">
          <form
            onSubmit={(event) => void handleAddAluno(event)}
            className="rounded-2xl border border-amet-blue/15 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-amet-indigo">Incluir aluno na base</h2>
            <p className="mt-1 text-sm text-amet-indigo/70">
              CPFs desta lista podem se candidatar como aluno AMET.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-amet-indigo">CPF</span>
                <input
                  value={newAlunoCpf}
                  onChange={(e) => setNewAlunoCpf(formatCpf(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-3 text-amet-indigo outline-none focus:border-amet-blue"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-amet-indigo">Nome (opcional)</span>
                <input
                  value={newAlunoNome}
                  onChange={(e) => setNewAlunoNome(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-3 text-amet-indigo outline-none focus:border-amet-blue"
                  placeholder="Nome para facilitar a busca"
                  maxLength={120}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={savingAluno}
              className="mt-4 rounded-full bg-amet-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-amet-indigo disabled:opacity-50"
            >
              {savingAluno ? "Salvando…" : "Incluir CPF"}
            </button>
          </form>

          <div>
            <label className="block max-w-md">
              <span className="text-sm font-medium text-amet-indigo">Buscar por CPF ou nome</span>
              <input
                value={alunoQuery}
                onChange={(e) => setAlunoQuery(e.target.value)}
                className="mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-3 text-amet-indigo outline-none focus:border-amet-blue"
                placeholder="Digite para filtrar…"
              />
            </label>
            <p className="mt-2 text-xs text-amet-indigo/60">
              Mostrando {participantes.length} de {participantesTotal}
              {alunoQuery.trim() ? " (filtro ativo)" : ""}.
            </p>
          </div>

          <div className="space-y-4">
            {participantes.map((item) => (
              <article
                key={item.cpf}
                className="rounded-2xl border border-amet-blue/15 bg-white p-5 shadow-sm"
              >
                {editingCpf === item.cpf ? (
                  <form
                    onSubmit={(event) => void handleSaveEdit(event)}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    <label className="block">
                      <span className="text-sm font-medium text-amet-indigo">CPF</span>
                      <input
                        value={editCpfValue}
                        onChange={(e) => setEditCpfValue(formatCpf(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-3 text-amet-indigo outline-none focus:border-amet-blue"
                        inputMode="numeric"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-amet-indigo">Nome</span>
                      <input
                        value={editNomeValue}
                        onChange={(e) => setEditNomeValue(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-amet-blue/20 px-4 py-3 text-amet-indigo outline-none focus:border-amet-blue"
                        maxLength={120}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <button
                        type="submit"
                        disabled={savingAluno}
                        className="rounded-full bg-amet-blue px-4 py-2 text-sm font-semibold text-white hover:bg-amet-indigo disabled:opacity-50"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={savingAluno}
                        className="rounded-full border border-amet-blue/20 px-4 py-2 text-sm font-medium text-amet-blue hover:bg-amet-blue/5 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-amet-indigo">
                        {item.nome || "Sem nome"}
                      </h2>
                      <p className="mt-1 font-mono text-sm text-amet-indigo/80">
                        {formatCpf(item.cpf)}
                      </p>
                      <p className="mt-1 text-xs text-amet-indigo/50">
                        Atualizado {formatDate(item.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        disabled={savingAluno}
                        className="rounded-full border border-amet-blue/20 px-4 py-2 text-sm font-medium text-amet-blue hover:bg-amet-blue/5 disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAluno(item.cpf, item.nome)}
                        disabled={savingAluno}
                        className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}

            {!loading && participantes.length === 0 && !error && (
              <p className="rounded-2xl border border-dashed border-amet-blue/20 p-12 text-center text-sm text-amet-indigo/60">
                Nenhum aluno encontrado{alunoQuery.trim() ? " para esta busca" : ""}.
              </p>
            )}

            {participantes.length < participantesTotal && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() =>
                    void fetchParticipantes(adminKey, alunoQuery, participantes.length)
                  }
                  disabled={loadingParticipantes}
                  className="rounded-full border border-amet-blue/20 px-5 py-2.5 text-sm font-medium text-amet-blue hover:bg-amet-blue/5 disabled:opacity-50"
                >
                  {loadingParticipantes ? "Carregando…" : "Carregar mais"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
