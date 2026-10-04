"use client";

import { useState } from "react";

import { Field, choiceButtonClass, inputClass } from "@/components/applicationFormUi";
import {
  buildCandidaturaPayload,
  emptyFormState,
  type FormState,
} from "@/components/applicationFormSteps";
import {
  AREAS,
  CURSOS,
  DIAS,
  ESTADOS_BR,
  FACULDADES,
  FORMAS_PAGAMENTO,
  HORARIOS_FACULDADE,
  PERIODOS,
  SEMESTRES,
  UNIDADES,
  areasDisponiveis,
  diasDisponiveis,
  labelSemestre,
  periodosDisponiveis,
  requiresFormaPagamento,
  type CursoCode,
  type DiaCode,
  type EstadoCode,
  type FaculdadeAceita,
  type FormaPagamentoCode,
  type HorarioFaculdadeCode,
  type SemestreValue,
  type TipoPerfil,
  type UnidadeCode,
} from "@/lib/constants";
import type { CandidaturaRecord } from "@/lib/db";
import { candidaturaSchema, isNaoAluno, type CandidaturaInput } from "@/lib/schemas";
import { formatCep, formatCpf, formatPhone, stripDigits } from "@/lib/validators";

const emptyForm: FormState = {
  ...emptyFormState,
  tipoPerfil: "aluno",
};

function formFromRecord(item: CandidaturaRecord): FormState {
  return {
    tipoPerfil: item.tipoPerfil,
    cpf: formatCpf(item.cpf),
    nomeCompleto: item.nomeCompleto,
    rgm: item.rgm,
    telefone: formatPhone(item.telefone),
    email: item.email,
    rua: item.rua,
    numero: item.numero,
    complemento: item.complemento ?? "",
    bairro: item.bairro,
    cep: formatCep(item.cep),
    cidade: item.cidade,
    estado: (item.estado as FormState["estado"]) || "",
    dataNascimento: item.dataNascimento,
    horarioFaculdade: (item.horarioFaculdade as FormState["horarioFaculdade"]) || "",
    semestreAtual: (item.semestreAtual as FormState["semestreAtual"]) || "",
    curso: (item.curso as FormState["curso"]) || "",
    faculdade: isNaoAluno(item) ? item.faculdade : "",
    formaPagamento:
      isNaoAluno(item) && item.formaPagamento
        ? (item.formaPagamento as FormaPagamentoCode)
        : "",
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
  const showPagamento =
    form.tipoPerfil === "nao_aluno" &&
    Boolean(form.faculdade) &&
    requiresFormaPagamento(form.faculdade);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectTipo(tipo: TipoPerfil) {
    setForm((current) => ({
      ...current,
      tipoPerfil: tipo,
      faculdade: tipo === "aluno" ? "" : current.faculdade,
      formaPagamento: tipo === "aluno" ? "" : current.formaPagamento,
    }));
  }

  function selectFaculdade(faculdade: FaculdadeAceita) {
    setForm((current) => ({
      ...current,
      faculdade,
      formaPagamento: requiresFormaPagamento(faculdade) ? current.formaPagamento : "",
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
    const parsed = candidaturaSchema.safeParse({
      ...buildCandidaturaPayload(form),
      cpf: stripDigits(form.cpf),
    });
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
        <Field id="admin-nascimento" label="Data de nascimento">
          <input
            type="date"
            value={form.dataNascimento}
            onChange={(event) => updateField("dataNascimento", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-rua" label="Rua" className="sm:col-span-2">
          <input
            value={form.rua}
            onChange={(event) => updateField("rua", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-numero" label="Número">
          <input
            value={form.numero}
            onChange={(event) => updateField("numero", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-complemento" label="Complemento (opcional)">
          <input
            value={form.complemento}
            onChange={(event) => updateField("complemento", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-bairro" label="Bairro">
          <input
            value={form.bairro}
            onChange={(event) => updateField("bairro", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-cep" label="CEP">
          <input
            value={form.cep}
            onChange={(event) => updateField("cep", formatCep(event.target.value))}
            className={inputClass()}
            inputMode="numeric"
          />
        </Field>
        <Field id="admin-cidade" label="Cidade">
          <input
            value={form.cidade}
            onChange={(event) => updateField("cidade", event.target.value)}
            className={inputClass()}
          />
        </Field>
        <Field id="admin-estado" label="Estado">
          <select
            value={form.estado}
            onChange={(event) => updateField("estado", event.target.value as EstadoCode | "")}
            className={inputClass()}
          >
            <option value="">Selecione</option>
            {ESTADOS_BR.map((estado) => (
              <option key={estado.code} value={estado.code}>
                {estado.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="admin-semestre" label="Semestre atual">
          <select
            value={form.semestreAtual}
            onChange={(event) =>
              updateField("semestreAtual", event.target.value as SemestreValue | "")
            }
            className={inputClass()}
          >
            <option value="">Selecione</option>
            {SEMESTRES.map((semestre) => (
              <option key={semestre} value={semestre}>
                {labelSemestre(semestre)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-amet-indigo/80">Horário da faculdade</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {HORARIOS_FACULDADE.map((horario) => (
            <button
              key={horario.code}
              type="button"
              aria-pressed={form.horarioFaculdade === horario.code}
              onClick={() => updateField("horarioFaculdade", horario.code as HorarioFaculdadeCode)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${choiceButtonClass(
                form.horarioFaculdade === horario.code,
              )}`}
            >
              {horario.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-amet-indigo/80">Curso</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CURSOS.map((curso) => (
            <button
              key={curso.code}
              type="button"
              aria-pressed={form.curso === curso.code}
              onClick={() => updateField("curso", curso.code as CursoCode)}
              className={`rounded-xl border px-3 py-2 text-left text-sm font-medium ${choiceButtonClass(
                form.curso === curso.code,
              )}`}
            >
              {curso.label}
            </button>
          ))}
        </div>
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
                onClick={() => selectFaculdade(faculdade)}
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

      {showPagamento ? (
        <div>
          <p className="mb-2 text-sm font-medium text-amet-indigo/80">Forma de pagamento</p>
          <div className="grid gap-2">
            {FORMAS_PAGAMENTO.map((forma) => (
              <button
                key={forma.code}
                type="button"
                aria-pressed={form.formaPagamento === forma.code}
                onClick={() => updateField("formaPagamento", forma.code)}
                className={`rounded-xl border px-3 py-2 text-left text-sm ${choiceButtonClass(
                  form.formaPagamento === forma.code,
                )}`}
              >
                {forma.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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
