"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CandidaturaEditor } from "@/components/admin/CandidaturaEditor";
import { formatDate, labelArea, labelDias, labelPeriodo, labelUnidade } from "@/components/admin/adminLabels";
import { adminHeaders, readAdminError } from "@/lib/adminClient";
import { labelTipoPerfil } from "@/lib/constants";
import type { CandidaturaRecord } from "@/lib/db";
import { isNaoAluno, type CandidaturaInput } from "@/lib/schemas";
import {
  buildCandidaturasXlsxFilename,
  forceXlsxFilename,
  isXlsxBuffer,
  XLSX_MIME,
} from "@/lib/xlsxDownload";

type Filter = "todos" | "aluno" | "nao_aluno";
type EditorMode = { type: "create" } | { type: "edit"; item: CandidaturaRecord };

function buildWhatsAppLink(telefone: string, nomeCompleto: string): string {
  let digits = telefone.replace(/\D/g, "");
  if (!digits.startsWith("55")) digits = `55${digits}`;
  const firstName = nomeCompleto.trim().split(/\s+/)[0] || "";
  const text = firstName
    ? `Olá ${firstName}, tudo bem? Aqui é da AMET Saúde & Estética.`
    : "Olá, tudo bem? Aqui é da AMET Saúde & Estética.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function matchesFilter(item: CandidaturaRecord, filter: Filter): boolean {
  switch (filter) {
    case "todos":
      return true;
    case "aluno":
      return item.tipoPerfil === "aluno";
    case "nao_aluno":
      return item.tipoPerfil === "nao_aluno";
    default: {
      const exhaustive: never = filter;
      return exhaustive;
    }
  }
}

type CandidaturasPanelProps = {
  adminKey: string;
};

export function CandidaturasPanel({ adminKey }: CandidaturasPanelProps) {
  const [candidaturas, setCandidaturas] = useState<CandidaturaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [editor, setEditor] = useState<EditorMode | null>(null);

  const fetchCandidaturas = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/candidaturas", {
        headers: adminHeaders(adminKey, false),
        cache: "no-store",
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? "Chave de acesso inválida."
            : await readAdminError(response, "Erro ao carregar candidaturas."),
        );
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
  }, [adminKey]);

  useEffect(() => {
    void fetchCandidaturas();
  }, [fetchCandidaturas]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return candidaturas.filter((item) => {
      if (!matchesFilter(item, filter)) return false;
      if (!needle) return true;
      return (
        item.nomeCompleto.toLowerCase().includes(needle) ||
        item.cpf.includes(needle.replace(/\D/g, "")) ||
        item.email.toLowerCase().includes(needle)
      );
    });
  }, [candidaturas, filter, query]);

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
        setError("A planilha gerada é inválida. Atualize a página (Ctrl+F5) e tente de novo.");
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

  async function handleSave(payload: CandidaturaInput) {
    setSaving(true);
    setFormError("");
    try {
      const isEdit = editor?.type === "edit";
      const url = isEdit
        ? `/api/admin/candidaturas/${editor.item.id}`
        : "/api/admin/candidaturas";
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: adminHeaders(adminKey),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setFormError(await readAdminError(response, "Não foi possível salvar."));
        return;
      }
      setEditor(null);
      await fetchCandidaturas();
    } catch {
      setFormError("Não foi possível conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CandidaturaRecord) {
    const confirmed = window.confirm(
      `Excluir a candidatura de ${item.nomeCompleto}? O CPF poderá se inscrever de novo. A base de alunos não é alterada.`,
    );
    if (!confirmed) return;

    setError("");
    try {
      const response = await fetch(`/api/admin/candidaturas/${item.id}`, {
        method: "DELETE",
        headers: adminHeaders(adminKey, false),
      });
      if (!response.ok) {
        setError(await readAdminError(response, "Não foi possível excluir."));
        return;
      }
      await fetchCandidaturas();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    }
  }

  if (editor) {
    return (
      <section className="rounded-2xl border border-amet-blue/15 bg-white p-6">
        <h2 className="text-lg font-semibold text-amet-indigo">
          {editor.type === "edit" ? "Editar candidatura" : "Incluir candidatura"}
        </h2>
        <div className="mt-6">
          <CandidaturaEditor
            initial={editor.type === "edit" ? editor.item : undefined}
            submitting={saving}
            error={formError}
            onCancel={() => {
              setEditor(null);
              setFormError("");
            }}
            onSubmit={(payload) => void handleSave(payload)}
          />
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-amet-indigo/70">{candidaturas.length} registro(s)</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void fetchCandidaturas()}
            disabled={loading}
            className="rounded-full border border-amet-blue/20 px-4 py-2 text-sm font-medium text-amet-blue hover:bg-amet-blue/5 disabled:opacity-50"
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || candidaturas.length === 0}
            className="rounded-full border border-amet-blue/20 px-4 py-2 text-sm font-medium text-amet-blue hover:bg-amet-blue/5 disabled:opacity-50"
          >
            {exporting ? "Gerando…" : "Baixar Excel"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setEditor({ type: "create" });
            }}
            className="rounded-full bg-amet-blue px-4 py-2 text-sm font-medium text-white hover:bg-amet-indigo"
          >
            Incluir candidatura
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, CPF ou e-mail"
          className="w-full rounded-xl border border-amet-blue/20 px-4 py-2 text-sm outline-none focus:border-amet-blue"
        />
        <div className="flex gap-2">
          {(["todos", "aluno", "nao_aluno"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-2 text-xs font-medium ${
                filter === item
                  ? "bg-amet-blue text-white"
                  : "border border-amet-blue/20 text-amet-blue"
              }`}
            >
              {item === "todos" ? "Todos" : item === "aluno" ? "Alunos" : "Não alunos"}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 space-y-6">
        {visible.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-amet-blue/15 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amet-blue/10 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-amet-indigo">{item.nomeCompleto}</h2>
                <p className="text-xs text-amet-indigo/70">
                  {formatDate(item.createdAt)} · {labelTipoPerfil(item.tipoPerfil)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amet-blue/10 px-3 py-1 text-xs font-medium text-amet-blue">
                  RGM {item.rgm || "—"}
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
                <button
                  type="button"
                  onClick={() => {
                    setFormError("");
                    setEditor({ type: "edit", item });
                  }}
                  className="rounded-full border border-amet-blue/20 px-3 py-1 text-xs font-semibold text-amet-blue hover:bg-amet-blue/5"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item)}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Excluir
                </button>
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
              {isNaoAluno(item) && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">Faculdade</dt>
                  <dd className="mt-1 text-sm text-amet-indigo">{item.faculdade || "—"}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">Unidade</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{labelUnidade(item.unidade) || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">
                  Área de estágio
                </dt>
                <dd className="mt-1 text-sm text-amet-indigo">{labelArea(item.area) || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">Turno</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{labelPeriodo(item.periodo) || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/70">Dias</dt>
                <dd className="mt-1 text-sm text-amet-indigo">{labelDias(item.dias) || "—"}</dd>
              </div>
            </dl>
          </article>
        ))}

        {!loading && visible.length === 0 && !error && (
          <p className="rounded-2xl border border-dashed border-amet-blue/20 p-12 text-center text-sm text-amet-indigo/60">
            Nenhuma candidatura encontrada.
          </p>
        )}
      </div>
    </section>
  );
}
