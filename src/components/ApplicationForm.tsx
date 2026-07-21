"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { StepIndicator } from "@/components/StepIndicator";
import {
  ALUNO_STEPS,
  AREAS,
  DIAS,
  NAO_ALUNO_STEPS,
  PERIODOS,
  POLLING_INTERVAL_MS,
  UNIDADES,
  areasDisponiveis,
  diasDisponiveis,
  type AreaCode,
  type DiaCode,
  type PeriodoCode,
  type TipoPerfil,
  type UnidadeCode,
} from "@/lib/constants";
import type { AreaVacancy } from "@/lib/db";
import { candidaturaSchema, cpfLookupSchema, personalDataSchema } from "@/lib/schemas";
import { formatCpf, formatPhone, stripDigits } from "@/lib/validators";

type FormState = {
  tipoPerfil: TipoPerfil | "";
  cpf: string;
  nomeCompleto: string;
  rgm: string;
  telefone: string;
  email: string;
  unidade: UnidadeCode | "";
  area: AreaCode | "";
  periodo: PeriodoCode | "";
  dias: DiaCode[];
};

const initialForm: FormState = {
  tipoPerfil: "",
  cpf: "",
  nomeCompleto: "",
  rgm: "",
  telefone: "",
  email: "",
  unidade: "",
  area: "",
  periodo: "",
  dias: [],
};

export function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vagas, setVagas] = useState<AreaVacancy[]>([]);
  const [loadingVagas, setLoadingVagas] = useState(false);
  const [checkingCpf, setCheckingCpf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [cpfNotice, setCpfNotice] = useState("");

  const isAluno = form.tipoPerfil === "aluno";
  const isNaoAluno = form.tipoPerfil === "nao_aluno";
  const stepLabels = isNaoAluno ? NAO_ALUNO_STEPS : ALUNO_STEPS;
  const maxStep = stepLabels.length;

  const availableAreas = useMemo(
    () => (form.unidade ? areasDisponiveis(form.unidade) : []),
    [form.unidade],
  );

  const selectedAreaConfig = form.area ? AREAS[form.area] : null;

  const availableDias = useMemo(() => {
    if (!form.area || !form.periodo) return [] as DiaCode[];
    return diasDisponiveis(form.area, form.periodo);
  }, [form.area, form.periodo]);

  const fetchVagas = useCallback(async () => {
    setLoadingVagas(true);
    try {
      const response = await fetch("/api/vagas", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { areas: AreaVacancy[] };
      setVagas(data.areas);
    } finally {
      setLoadingVagas(false);
    }
  }, []);

  useEffect(() => {
    if (!isAluno || step < 4) return;
    void fetchVagas();
    const interval = setInterval(() => void fetchVagas(), POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAluno, step, fetchVagas]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => {
      const next = { ...c };
      delete next[key as string];
      return next;
    });
  }

  async function handleCpfSubmit() {
    const parsed = cpfLookupSchema.safeParse({ cpf: form.cpf });
    if (!parsed.success) {
      setErrors({ cpf: "CPF inválido" });
      return;
    }

    setCheckingCpf(true);
    setErrors({});
    try {
      const response = await fetch("/api/participantes/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: parsed.data.cpf }),
      });
      const data = (await response.json()) as { error?: string; found?: boolean };

      if (!response.ok) {
        setErrors({ cpf: data.error ?? "Não foi possível verificar o CPF." });
        return;
      }

      if (data.found) {
        updateField("tipoPerfil", "aluno");
        setCpfNotice("CPF encontrado na base de alunos AMET.");
      } else {
        updateField("tipoPerfil", "nao_aluno");
        setCpfNotice("CPF não encontrado na base de alunos AMET — seguindo como não aluno.");
      }
      updateField("cpf", parsed.data.cpf);
      setStep(2);
    } catch {
      setErrors({ cpf: "Erro de conexão ao verificar o CPF." });
    } finally {
      setCheckingCpf(false);
    }
  }

  function validateDados(): boolean {
    const result = personalDataSchema.safeParse({ ...form, cpf: stripDigits(form.cpf) });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    if (isAluno && !form.rgm.trim()) {
      setErrors({ rgm: "Informe seu RGM" });
      return false;
    }
    setErrors({});
    return true;
  }

  function toggleDia(code: DiaCode) {
    setForm((c) => ({
      ...c,
      dias: c.dias.includes(code) ? c.dias.filter((d) => d !== code) : [...c.dias, code],
    }));
    setErrors((c) => {
      const n = { ...c };
      delete n.dias;
      return n;
    });
  }

  function buildPayload() {
    if (isNaoAluno) {
      return {
        tipoPerfil: "nao_aluno" as const,
        nomeCompleto: form.nomeCompleto,
        rgm: form.rgm,
        cpf: stripDigits(form.cpf),
        telefone: form.telefone,
        email: form.email,
      };
    }
    return {
      tipoPerfil: "aluno" as const,
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
  }

  async function submitCandidatura() {
    const parsed = candidaturaSchema.safeParse(buildPayload());
    if (!parsed.success) {
      setSubmitError("Revise os dados antes de enviar.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/candidaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setSubmitError(data.error ?? "Não foi possível enviar.");
        if (response.status === 409) void fetchVagas();
        return;
      }

      setSuccess(true);
      setForm(initialForm);
      setStep(1);
      setCpfNotice("");
      void fetchVagas();
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (step === 2) {
      if (!validateDados()) return;
      if (isNaoAluno) {
        void submitCandidatura();
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!form.unidade) {
        setErrors({ unidade: "Selecione uma unidade" });
        return;
      }
      setErrors({});
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!form.area) {
        setErrors({ area: "Selecione uma área" });
        return;
      }
      setErrors({});
      setStep(5);
      return;
    }
    if (step === 5) {
      if (!form.periodo) {
        setErrors({ periodo: "Selecione um turno" });
        return;
      }
      if (form.dias.length === 0) {
        setErrors({ dias: "Selecione ao menos um dia" });
        return;
      }
      setErrors({});
      setStep(6);
      return;
    }
  }

  function goBack() {
    setErrors({});
    setSubmitError("");
    if (step === 3) {
      updateField("area", "");
      updateField("periodo", "");
      updateField("dias", []);
    }
    if (step === 4) {
      updateField("periodo", "");
      updateField("dias", []);
    }
    setStep((s) => Math.max(1, s - 1));
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-amet-blue/20 bg-amet-blue/5 p-8 text-center">
        <h2 className="text-2xl font-semibold text-amet-blue">
          {isNaoAluno ? "Recebemos seus dados!" : "Inscrição registrada!"}
        </h2>
        <p className="mt-3 text-amet-indigo/70">
          {isNaoAluno
            ? "A equipe da AMET entrará em contato em breve."
            : "Recebemos sua candidatura. A AMET entrará em contato pelo e-mail informado."}
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-6 rounded-full bg-amet-purple px-6 py-3 text-sm font-semibold text-amet-white"
        >
          Nova inscrição
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-amet-blue/15 bg-gradient-to-br from-amet-blue/10 via-amet-white to-amet-purple/10 p-6 shadow-lg shadow-amet-blue/10 sm:p-8">
      <StepIndicator currentStep={step} labels={stepLabels} />

      <div className="mt-8">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-amet-indigo/70">
              Informe seu CPF para verificarmos se você é aluno AMET.
            </p>
            <Field label="CPF" error={errors.cpf}>
              <input
                value={form.cpf}
                onChange={(e) => updateField("cpf", formatCpf(e.target.value))}
                className={inputClass(errors.cpf)}
                inputMode="numeric"
                placeholder="000.000.000-00"
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {cpfNotice && (
              <p className="sm:col-span-2 rounded-xl border border-amet-blue/25 bg-amet-blue/5 px-4 py-3 text-sm text-amet-indigo/80">
                {cpfNotice}
              </p>
            )}
            <Field label="Nome completo" error={errors.nomeCompleto} className="sm:col-span-2">
              <input
                value={form.nomeCompleto}
                onChange={(e) => updateField("nomeCompleto", e.target.value)}
                className={inputClass(errors.nomeCompleto)}
              />
            </Field>
            <Field label={isAluno ? "RGM" : "RGM (opcional)"} error={errors.rgm}>
              <input
                value={form.rgm}
                onChange={(e) => updateField("rgm", e.target.value)}
                className={inputClass(errors.rgm)}
              />
            </Field>
            <Field label="E-mail" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={inputClass(errors.email)}
              />
            </Field>
            <Field label="Telefone / WhatsApp" error={errors.telefone} className="sm:col-span-2">
              <input
                value={form.telefone}
                onChange={(e) => updateField("telefone", formatPhone(e.target.value))}
                className={inputClass(errors.telefone)}
                inputMode="tel"
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-amet-indigo/70">Selecione sua unidade.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {UNIDADES.map((u) => (
                <button
                  key={u.code}
                  type="button"
                  onClick={() => updateField("unidade", u.code)}
                  className={`rounded-2xl border px-4 py-4 font-medium transition ${
                    form.unidade === u.code
                      ? "border-amet-purple bg-amet-purple/10 text-amet-purple"
                      : "border-amet-indigo/15 text-amet-indigo/80 hover:border-amet-blue"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
            {errors.unidade && <p className="text-sm text-amet-purple">{errors.unidade}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-amet-indigo/70">
              Escolha a área de estágio. Áreas totalmente esgotadas não permitem candidatura.
            </p>
            {loadingVagas ? (
              <p className="text-sm text-amet-indigo/50">Carregando vagas...</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {availableAreas.map((code) => {
                  const config = AREAS[code];
                  const vacancy = vagas.find((v) => v.code === code);
                  const disabled = vacancy?.full ?? false;
                  const selected = form.area === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={disabled}
                      onClick={() => updateField("area", code)}
                      className={`rounded-2xl border p-5 text-left transition-all ${
                        disabled
                          ? "cursor-not-allowed border-amet-indigo/10 bg-amet-indigo/[0.03] opacity-60"
                          : selected
                            ? "border-amet-purple bg-amet-purple/5 shadow-md shadow-amet-purple/10"
                            : "border-amet-blue/15 bg-amet-white hover:border-amet-blue hover:shadow-sm"
                      }`}
                    >
                      <p className="text-lg font-bold text-amet-indigo">{config.label}</p>
                      <p className="mt-1 text-sm text-amet-indigo/60">
                        {disabled ? "Vagas esgotadas" : "20 vagas por turno"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.area && <p className="text-sm text-amet-purple">{errors.area}</p>}
          </div>
        )}

        {step === 5 && selectedAreaConfig && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-amet-indigo/70">Escolha o turno.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {selectedAreaConfig.periodos.map((periodo) => {
                  const label = PERIODOS.find((p) => p.code === periodo)?.label ?? periodo;
                  const areaVacancy = vagas.find((v) => v.code === form.area);
                  const periodoVacancy = areaVacancy?.periodos.find((p) => p.periodo === periodo);
                  const disabled = periodoVacancy?.full ?? false;
                  const selected = form.periodo === periodo;
                  return (
                    <button
                      key={periodo}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        updateField("periodo", periodo);
                        updateField("dias", []);
                      }}
                      className={`rounded-2xl border px-4 py-4 font-medium transition ${
                        disabled
                          ? "cursor-not-allowed border-amet-indigo/10 bg-amet-indigo/[0.03] opacity-60"
                          : selected
                            ? "border-amet-blue bg-amet-blue/10 text-amet-blue"
                            : "border-amet-indigo/15 text-amet-indigo/80 hover:border-amet-purple"
                      }`}
                    >
                      {label}
                      {disabled && <span className="block text-xs">Esgotado</span>}
                    </button>
                  );
                })}
              </div>
              {errors.periodo && <p className="text-sm text-amet-purple">{errors.periodo}</p>}
            </div>

            {form.periodo && (
              <div className="space-y-3">
                <p className="text-sm text-amet-indigo/70">Selecione os dias.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {availableDias.map((dia) => {
                    const label = DIAS.find((d) => d.code === dia)?.label ?? dia;
                    const selected = form.dias.includes(dia);
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => toggleDia(dia)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                          selected
                            ? "border-amet-purple bg-amet-purple/10 text-amet-purple"
                            : "border-amet-indigo/15 text-amet-indigo/80 hover:border-amet-blue"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {errors.dias && <p className="text-sm text-amet-purple">{errors.dias}</p>}
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <p className="text-sm text-amet-indigo/70">Confirme os dados antes de enviar.</p>
            <dl className="grid gap-4 rounded-2xl border border-amet-blue/15 bg-amet-white p-5 sm:grid-cols-2">
              <SummaryItem label="Nome" value={form.nomeCompleto} />
              <SummaryItem label="RGM" value={form.rgm} />
              <SummaryItem label="CPF" value={form.cpf} />
              <SummaryItem label="Telefone" value={form.telefone} />
              <SummaryItem label="E-mail" value={form.email} className="sm:col-span-2" />
              <SummaryItem
                label="Unidade"
                value={UNIDADES.find((u) => u.code === form.unidade)?.label ?? ""}
              />
              <SummaryItem
                label="Área"
                value={form.area ? AREAS[form.area].label : ""}
              />
              <SummaryItem
                label="Turno"
                value={PERIODOS.find((p) => p.code === form.periodo)?.label ?? ""}
              />
              <SummaryItem
                label="Dias"
                value={form.dias
                  .map((d) => DIAS.find((x) => x.code === d)?.label ?? d)
                  .join(", ")}
                className="sm:col-span-2"
              />
            </dl>
          </div>
        )}
      </div>

      {submitError && (
        <p className="mt-6 rounded-xl border border-amet-purple/40 bg-amet-purple/10 px-4 py-3 text-sm text-amet-purple">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="rounded-full border border-amet-indigo/20 px-6 py-3 text-sm text-amet-indigo/70 hover:border-amet-blue hover:text-amet-blue"
          >
            Voltar
          </button>
        ) : (
          <span />
        )}

        {step === 1 && (
          <button
            type="button"
            disabled={checkingCpf}
            onClick={() => void handleCpfSubmit()}
            className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-amet-white hover:bg-amet-purple disabled:opacity-60"
          >
            {checkingCpf ? "Verificando CPF..." : "Continuar"}
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            disabled={submitting}
            onClick={goNext}
            className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-amet-white hover:bg-amet-purple disabled:opacity-60"
          >
            {isNaoAluno ? (submitting ? "Enviando..." : "Enviar") : "Continuar"}
          </button>
        )}

        {step >= 3 && step < maxStep && (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-amet-white hover:bg-amet-purple"
          >
            Continuar
          </button>
        )}

        {step === maxStep && step >= 6 && (
          <button
            type="button"
            onClick={() => void submitCandidatura()}
            disabled={submitting}
            className="rounded-full bg-amet-purple px-6 py-3 text-sm font-semibold text-amet-white hover:bg-amet-blue disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Enviar candidatura"}
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-amet-indigo/50">{label}</dt>
      <dd className="mt-1 text-sm text-amet-indigo">{value || "—"}</dd>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block space-y-2 ${className ?? ""}`}>
      <span className="text-sm font-medium text-amet-indigo/80">{label}</span>
      {children}
      {error && <span className="block text-sm text-amet-purple">{error}</span>}
    </label>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-xl border bg-amet-white px-4 py-3 text-amet-indigo outline-none transition placeholder:text-amet-indigo/35 ${
    error ? "border-amet-purple" : "border-amet-indigo/15 focus:border-amet-blue"
  }`;
}
