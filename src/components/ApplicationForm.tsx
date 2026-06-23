"use client";

import { useCallback, useEffect, useState } from "react";

import { AreaCard, type VacancyInfo } from "@/components/AreaCard";
import { StepIndicator } from "@/components/StepIndicator";
import { CURSOS, POLLING_INTERVAL_MS, type AreaCode } from "@/lib/constants";
import {
  areaSchema,
  candidaturaSchema,
  cursoSchema,
  personalDataSchema,
  type PersonalData,
} from "@/lib/schemas";
import { formatCpf, formatPhone } from "@/lib/validators";

type FormState = PersonalData & {
  areaInteresse: AreaCode | "";
  cursoAtual: (typeof CURSOS)[number] | "";
};

const initialForm: FormState = {
  nomeCompleto: "",
  rgm: "",
  cpf: "",
  telefone: "",
  email: "",
  areaInteresse: "",
  cursoAtual: "",
};

export function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [areas, setAreas] = useState<VacancyInfo[]>([]);
  const [loadingVagas, setLoadingVagas] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const fetchVagas = useCallback(async () => {
    try {
      const response = await fetch("/api/vagas", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { areas: VacancyInfo[] };
      setAreas(data.areas);
    } finally {
      setLoadingVagas(false);
    }
  }, []);

  useEffect(() => {
    void fetchVagas();
    const interval = setInterval(() => {
      void fetchVagas();
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchVagas]);

  useEffect(() => {
    if (!form.areaInteresse) return;
    const selected = areas.find((area) => area.code === form.areaInteresse);
    if (selected?.full) {
      setForm((current) => ({ ...current, areaInteresse: "" }));
    }
  }, [areas, form.areaInteresse]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function validateStep(currentStep: number): boolean {
    if (currentStep === 1) {
      const result = personalDataSchema.safeParse(form);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string" && !fieldErrors[key]) {
            fieldErrors[key] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return false;
      }
      setErrors({});
      return true;
    }

    if (currentStep === 2) {
      const result = areaSchema.safeParse(form);
      if (!result.success) {
        setErrors({ areaInteresse: "Selecione uma área de interesse" });
        return false;
      }
      const selected = areas.find((area) => area.code === form.areaInteresse);
      if (selected?.full) {
        setErrors({ areaInteresse: "Esta área está com vagas esgotadas" });
        return false;
      }
      setErrors({});
      return true;
    }

    if (currentStep === 3) {
      const result = cursoSchema.safeParse(form);
      if (!result.success) {
        setErrors({ cursoAtual: "Selecione seu curso atual na AMET" });
        return false;
      }
      setErrors({});
      return true;
    }

    return false;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(current + 1, 3));
  }

  function goBack() {
    setErrors({});
    setSubmitError("");
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;

    const parsed = candidaturaSchema.safeParse(form);
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

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setSubmitError(data.error ?? "Não foi possível enviar sua candidatura.");
        if (response.status === 409) {
          void fetchVagas();
        }
        return;
      }

      setSuccess(true);
      setForm(initialForm);
      setStep(1);
      void fetchVagas();
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-amet-blue/30 bg-amet-blue/10 p-8 text-center">
        <h2 className="text-2xl font-semibold text-amet-blue">
          Candidatura enviada com sucesso!
        </h2>
        <p className="mt-3 text-amet-white/75">
          Recebemos sua inscrição. A AMET entrará em contato pelo e-mail informado.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-6 rounded-full bg-amet-purple px-6 py-3 text-sm font-semibold text-amet-white transition hover:bg-amet-blue"
        >
          Enviar nova candidatura
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-amet-white/15 bg-amet-white/5 p-6 shadow-2xl shadow-amet-indigo/50 backdrop-blur-sm sm:p-8">
      <div className="mb-8 space-y-3">
        <h2 className="text-2xl font-semibold text-amet-white">Formulário de Candidatura</h2>
        <p className="text-sm text-amet-white/65">
          Preencha as três etapas abaixo. A disponibilidade de vagas é atualizada
          automaticamente a cada 30 segundos.
        </p>
        <StepIndicator currentStep={step} />
      </div>

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" error={errors.nomeCompleto} className="sm:col-span-2">
            <input
              value={form.nomeCompleto}
              onChange={(event) => updateField("nomeCompleto", event.target.value)}
              className={inputClass(errors.nomeCompleto)}
              placeholder="Seu nome completo"
            />
          </Field>
          <Field label="RGM" error={errors.rgm}>
            <input
              value={form.rgm}
              onChange={(event) => updateField("rgm", event.target.value)}
              className={inputClass(errors.rgm)}
              placeholder="Registro Geral de Matrícula"
            />
          </Field>
          <Field label="CPF" error={errors.cpf}>
            <input
              value={form.cpf}
              onChange={(event) => updateField("cpf", formatCpf(event.target.value))}
              className={inputClass(errors.cpf)}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </Field>
          <Field label="Telefone / WhatsApp" error={errors.telefone}>
            <input
              value={form.telefone}
              onChange={(event) => updateField("telefone", formatPhone(event.target.value))}
              className={inputClass(errors.telefone)}
              placeholder="(11) 99999-9999"
              inputMode="tel"
            />
          </Field>
          <Field label="E-mail" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={inputClass(errors.email)}
              placeholder="seu@email.com"
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-amet-white/75">
            Escolha uma área de interesse. Áreas esgotadas não permitem novas candidaturas.
          </p>
          {loadingVagas ? (
            <p className="text-sm text-amet-white/55">Carregando vagas...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {areas.map((area) => (
                <AreaCard
                  key={area.code}
                  area={area}
                  selected={form.areaInteresse === area.code}
                  onSelect={(code) => updateField("areaInteresse", code)}
                />
              ))}
            </div>
          )}
          {errors.areaInteresse && (
            <p className="text-sm text-amet-purple">{errors.areaInteresse}</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-amet-white/75">
            Selecione o curso que você cursa atualmente na AMET.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CURSOS.map((curso) => {
              const selected = form.cursoAtual === curso;
              return (
                <button
                  key={curso}
                  type="button"
                  onClick={() => updateField("cursoAtual", curso)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                    selected
                      ? "border-amet-blue bg-amet-blue/15 text-amet-blue"
                      : "border-amet-white/20 bg-amet-white/5 text-amet-white/80 hover:border-amet-purple"
                  }`}
                >
                  {curso}
                </button>
              );
            })}
          </div>
          {errors.cursoAtual && (
            <p className="text-sm text-amet-purple">{errors.cursoAtual}</p>
          )}
        </div>
      )}

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
            className="rounded-full border border-amet-white/25 px-6 py-3 text-sm font-medium text-amet-white/80 transition hover:border-amet-blue hover:text-amet-blue"
          >
            Voltar
          </button>
        ) : (
          <span />
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-amet-white transition hover:bg-amet-purple"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="rounded-full bg-amet-purple px-6 py-3 text-sm font-semibold text-amet-white transition hover:bg-amet-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Enviar candidatura"}
          </button>
        )}
      </div>
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
      <span className="text-sm font-medium text-amet-white/80">{label}</span>
      {children}
      {error && <span className="block text-sm text-amet-purple">{error}</span>}
    </label>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-xl border bg-amet-indigo/60 px-4 py-3 text-amet-white outline-none transition placeholder:text-amet-white/35 ${
    error
      ? "border-amet-purple focus:border-amet-purple"
      : "border-amet-white/20 focus:border-amet-blue"
  }`;
}
