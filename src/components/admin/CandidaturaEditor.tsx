"use client";

import { useState } from "react";

import { Field, choiceButtonClass, inputClass } from "@/components/applicationFormUi";
import type { FormState } from "@/components/applicationFormSteps";
import {
  AREAS,
  DIAS,
  FACULDADES,
  PERIODOS,
  UNIDADES,
  areasDisponiveis,
  diasDisponiveis,
  periodosDisponiveis,
  type DiaCode,
  type TipoPerfil,
  type UnidadeCode,
} from "@/lib/constants";
import type { CandidaturaRecord } from "@/lib/db";
import { candidaturaSchema, isNaoAluno, type CandidaturaInput } from "@/lib/schemas";
import { formatCpf, formatPhone, stripDigits } from "@/lib/validators";

const emptyForm: FormState = {
  tipoPerfil: "aluno",
  cpf: "",
  nomeCompleto: "",
  rgm: "",
  telefone: "",
  email: "",
  faculdade: "",
  unidade: "",
  area: "",
  periodo: "",
  dias: [],
};

function formFromRecord(item: CandidaturaRecord): FormState {
  return {
    tipoPerfil: item.tipoPerfil,
    cpf: formatCpf(item.cpf),
    nomeCompleto: item.nomeCompleto,
    rgm: item.rgm,
    telefone: formatPhone(item.telefone),
    email: item.email,
    faculdade: isNaoAluno(item) ? item.faculdade : "",
    unidade: item.unidade as FormState["unidade"],
    area: item.area as FormState["area"],
    periodo: item.periodo as FormState["periodo"],
    dias: item.dias as FormState["dias"],
  };
}

function toggleDia(current: DiaCode[], code: DiaCode): DiaCode[] {
  if (code === "sab") {
    return current.includes("sab") ? [] : ["sab"];
  }
  if (current.includes(code)) {
    return current.filter((dia) => dia !== code);
  }
  if (current.includes("sab")) {
    return [code];
  }
  if (current.length >= 2) {
    return current;
  }
  return [...current, code];
}

function buildPayload(form: FormState) {
  const shared = {
    nomeCompleto: form.nomeCompleto,
    rgm: form.rgm,
    cpf: stripDigits(form.cpf),
    telefone: form.telefone,
    email: form.email,
    unidade: form.unidade,
    area: form.area,
    periodo: form.periodo,
    dias: form.dias,
  };

  switch (form.tipoPerfil) {
    case "nao_aluno":
      return { ...shared, tipoPerfil: "nao_aluno" as const, faculdade: form.faculdade };
    case "aluno":
      return { ...shared, tipoPerfil: "aluno" as const };
    case "":
      return { ...shared, tipoPerfil: "aluno" as const };
    default: {
      const exhaustive: never = form.tipoPerfil;
      return exhaustive;
    }
  }
}

type CandidaturaEditorProps = {
  initial?: CandidaturaRecord;
  submitting: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (payload: CandidaturaInput) => void;
};

export function CandidaturaEditor({
  initial,
  submitting,
  error,
  onCancel,
  onSubmit,
}: CandidaturaEditorProps) {
  const [form, setForm] = useState<FormState>(initial ? formFromRecord(initial) : emptyForm);
  const [localError, setLocalError] = useState("");

  const availableAreas = form.unidade ? areasDisponiveis(form.unidade) : [];
  const availablePeriodos =
    form.area && form.unidade ? periodosDisponiveis(form.area, form.unidade) : [];
  const availableDias =
    form.area && form.periodo ? diasDisponiveis(form.area, form.periodo) : [];

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectTipo(tipo: TipoPerfil) {
    setForm((current) => ({
      ...current,
      tipoPerfil: tipo,
      faculdade: tipo === "aluno" ? "" : current.faculdade,
    }));
  }

  function selectUnidade(code: UnidadeCode) {
    setForm((current) => ({
      ...current,
      unidade: code,
      area: "",
      periodo: "",
      dias: [],
    }));
  }

  function handleSubmit() {
    const parsed = candidaturaSchema.safeParse(buildPayload(form));
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? "Revise os dados.");
      return;
    }
    setLocalError("");
    onSubmit(parsed.data);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(["aluno", "nao_aluno"] as const).map((tipo) => (
          <button
            key={tipo}
            type="button"
            aria-pressed={form.tipoPerfil === tipo}
            onClick={() => selectTipo(tipo)}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${choiceButtonClass(
              form.tipoPerfil === tipo,
            )}`}
          >
            {tipo === "aluno" ? "Aluno AMET" : "Não aluno"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="admin-nome" label="Nome completo" className="sm:col-span-2">
          <input
            value={form.nomeCompleto}
            onChange={(event) => updateField("nomeCompleto", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-cpf" label="CPF">
          <input
            value={form.cpf}
            onChange={(event) => updateField("cpf", formatCpf(event.target.value))}
            className={inputClass()}
            inputMode="numeric"
          />
        </Field>
        <Field id="admin-rgm" label={form.tipoPerfil === "aluno" ? "RGM" : "RGM (opcional)"}>
          <input
            value={form.rgm}
            onChange={(event) => updateField("rgm", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-email" label="E-mail">
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-telefone" label="Telefone">
          <input
            value={form.telefone}
            onChange={(event) => updateField("telefone", formatPhone(event.target.value))}
            className={inputClass()}
            inputMode="tel"
          />
        </Field>
      </div>

      {form.tipoPerfil === "nao_aluno" && (
        <div>
          <p className="mb-2 text-sm font-medium text-amet-indigo/80">Faculdade</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FACULDADES.map((faculdade) => (
              <button
                key={faculdade}
                type="button"
                aria-pressed={form.faculdade === faculdade}
                onClick={() => updateField("faculdade", faculdade)}
                className={`rounded-xl border px-3 py-2 text-left text-sm ${choiceButtonClass(
                  form.faculdade === faculdade,
                )}`}
              >
                {faculdade}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-amet-indigo/80">Unidade</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {UNIDADES.map((unidade) => (
            <button
              key={unidade.code}
              type="button"
              aria-pressed={form.unidade === unidade.code}
              onClick={() => selectUnidade(unidade.code)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium ${choiceButtonClass(
                form.unidade === unidade.code,
              )}`}
            >
              {unidade.label}
            </button>
          ))}
        </div>
      </div>

      {form.unidade ? (
        <div>
          <p className="mb-2 text-sm font-medium text-amet-indigo/80">Área</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {availableAreas.map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={form.area === code}
                onClick={() =>
                  setForm((current) => ({ ...current, area: code, periodo: "", dias: [] }))
                }
                className={`rounded-xl border px-3 py-3 text-left text-sm font-medium ${choiceButtonClass(
                  form.area === code,
                )}`}
              >
                {AREAS[code].label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {form.area && form.unidade ? (
        <div>
          <p className="mb-2 text-sm font-medium text-amet-indigo/80">Turno</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {availablePeriodos.map((periodo) => (
              <button
                key={periodo}
                type="button"
                aria-pressed={form.periodo === periodo}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    periodo: periodo,
                    dias: [],
                  }))
                }
                className={`rounded-xl border px-3 py-3 text-sm font-medium ${choiceButtonClass(
                  form.periodo === periodo,
                )}`}
              >
                {PERIODOS.find((item) => item.code === periodo)?.label ?? periodo}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {form.periodo ? (
        <div>
          <p className="mb-2 text-sm font-medium text-amet-indigo/80">
            Dias (2 úteis ou apenas Sábado)
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {availableDias.map((dia) => {
              const selected = form.dias.includes(dia);
              const disabled =
                !selected && dia !== "sab" && (form.dias.includes("sab") || form.dias.length >= 2);
              return (
                <button
                  key={dia}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => updateField("dias", toggleDia(form.dias, dia))}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${choiceButtonClass(
                    selected,
                    disabled,
                  )}`}
                >
                  {DIAS.find((item) => item.code === dia)?.label ?? dia}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {localError || error ? (
        <p className="text-sm text-red-600">{localError || error}</p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-amet-indigo/20 px-5 py-2 text-sm text-amet-indigo/80"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-amet-blue px-5 py-2 text-sm font-semibold text-white hover:bg-amet-indigo disabled:opacity-50"
        >
          {submitting ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
