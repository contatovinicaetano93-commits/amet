"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Field, inputClass } from "@/components/applicationFormUi";
import { adminHeaders, readAdminError } from "@/lib/adminClient";
import { formatCpf, stripDigits } from "@/lib/validators";

type AlunoRecord = {
  cpf: string;
  nome: string;
  rgm: string;
};

type EditorMode = { type: "create" } | { type: "edit"; item: AlunoRecord };

type AlunosPanelProps = {
  adminKey: string;
};

export function AlunosPanel({ adminKey }: AlunosPanelProps) {
  const [alunos, setAlunos] = useState<AlunoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorMode | null>(null);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rgm, setRgm] = useState("");

  const fetchAlunos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/participantes", {
        headers: adminHeaders(adminKey, false),
        cache: "no-store",
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? "Chave de acesso inválida."
            : await readAdminError(response, "Erro ao carregar alunos."),
        );
        setAlunos([]);
        return;
      }
      const data = (await response.json()) as { participantes: AlunoRecord[] };
      setAlunos(data.participantes);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    void fetchAlunos();
  }, [fetchAlunos]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const digits = stripDigits(query);
    return alunos.filter((item) => {
      if (!needle) return true;
      return (
        item.nome.toLowerCase().includes(needle) ||
        item.cpf.includes(digits) ||
        item.rgm.toLowerCase().includes(needle)
      );
    });
  }, [alunos, query]);

  function openCreate() {
    setFormError("");
    setNome("");
    setCpf("");
    setRgm("");
    setEditor({ type: "create" });
  }

  function openEdit(item: AlunoRecord) {
    setFormError("");
    setNome(item.nome);
    setCpf(formatCpf(item.cpf));
    setRgm(item.rgm);
    setEditor({ type: "edit", item });
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      const isEdit = editor?.type === "edit";
      const url = isEdit
        ? `/api/participantes/${editor.item.cpf}`
        : "/api/participantes";
      const body = isEdit
        ? { nome, rgm }
        : { nome, rgm, cpf: stripDigits(cpf) };
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: adminHeaders(adminKey),
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setFormError(await readAdminError(response, "Não foi possível salvar."));
        return;
      }
      setEditor(null);
      await fetchAlunos();
    } catch {
      setFormError("Não foi possível conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: AlunoRecord) {
    const confirmed = window.confirm(
      `Remover ${item.nome || item.cpf} da base de alunos? O CPF deixa de ser reconhecido como aluno AMET. Candidaturas existentes não são apagadas.`,
    );
    if (!confirmed) return;

    setError("");
    try {
      const response = await fetch(`/api/participantes/${item.cpf}`, {
        method: "DELETE",
        headers: adminHeaders(adminKey, false),
      });
      if (!response.ok) {
        setError(await readAdminError(response, "Não foi possível excluir."));
        return;
      }
      await fetchAlunos();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    }
  }

  if (editor) {
    const isEdit = editor.type === "edit";
    return (
      <section className="rounded-2xl border border-amet-blue/15 bg-white p-6">
        <h2 className="text-lg font-semibold text-amet-indigo">
          {isEdit ? "Editar aluno" : "Incluir aluno"}
        </h2>
        <form
          className="mt-6 grid max-w-xl gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <Field id="aluno-nome" label="Nome completo">
            <input value={nome} onChange={(event) => setNome(event.target.value)} className={inputClass()} />
          </Field>
          <Field id="aluno-cpf" label="CPF">
            <input
              value={cpf}
              onChange={(event) => setCpf(formatCpf(event.target.value))}
              className={inputClass()}
              inputMode="numeric"
              disabled={isEdit}
            />
          </Field>
          <Field id="aluno-rgm" label="RGM (opcional)">
            <input value={rgm} onChange={(event) => setRgm(event.target.value)} className={inputClass()} />
          </Field>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="rounded-full border border-amet-indigo/20 px-5 py-2 text-sm text-amet-indigo/80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-amet-blue px-5 py-2 text-sm font-semibold text-white hover:bg-amet-indigo disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-amet-indigo/70">{alunos.length} aluno(s) na base AMET</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void fetchAlunos()}
            disabled={loading}
            className="rounded-full border border-amet-blue/20 px-4 py-2 text-sm font-medium text-amet-blue hover:bg-amet-blue/5 disabled:opacity-50"
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-amet-blue px-4 py-2 text-sm font-medium text-white hover:bg-amet-indigo"
          >
            Incluir aluno
          </button>
        </div>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por nome, CPF ou RGM"
        className="mt-6 w-full rounded-xl border border-amet-blue/20 px-4 py-2 text-sm outline-none focus:border-amet-blue"
      />

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-amet-blue/15 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-amet-blue/10 bg-amet-blue/5 text-xs uppercase tracking-wide text-amet-indigo/70">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CPF</th>
              <th className="px-4 py-3 font-medium">RGM</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.cpf} className="border-b border-amet-blue/10 last:border-0">
                <td className="px-4 py-3 text-amet-indigo">{item.nome || "—"}</td>
                <td className="px-4 py-3 text-amet-indigo">{formatCpf(item.cpf)}</td>
                <td className="px-4 py-3 text-amet-indigo">{item.rgm || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 && !error ? (
          <p className="p-8 text-center text-sm text-amet-indigo/60">Nenhum aluno encontrado.</p>
        ) : null}
      </div>
    </section>
  );
}
