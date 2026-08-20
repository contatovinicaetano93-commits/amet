"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { ApplicationFormSteps, type FormState, type FormStep } from "@/components/applicationFormSteps";
import { StepIndicator } from "@/components/StepIndicator";
import {
  ALUNO_STEPS,
  NAO_ALUNO_STEPS,
  areasDisponiveis,
  diasDisponiveis,
  periodosDisponiveis,
  type DiaCode,
  type PeriodoCode,
  type TipoPerfil,
  type UnidadeCode,
} from "@/lib/constants";
import {
  candidaturaSchema,
  cpfLookupSchema,
  diasSelectionError,
  personalDataSchema,
} from "@/lib/schemas";
import { stripDigits } from "@/lib/validators";

const initialForm: FormState = {
  tipoPerfil: "",
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

function stepsFor(tipoPerfil: TipoPerfil | ""): FormStep[] {
  switch (tipoPerfil) {
    case "nao_aluno":
      return ["cpf", "dados", "faculdade", "unidade", "area", "turno", "confirmar"];
    case "aluno":
      return ["cpf", "dados", "unidade", "area", "turno", "confirmar"];
    case "":
      return ["cpf"];
    default: {
      const exhaustive: never = tipoPerfil;
      return exhaustive;
    }
  }
}

function stepLabels(tipoPerfil: TipoPerfil | ""): readonly string[] {
  switch (tipoPerfil) {
    case "nao_aluno":
      return NAO_ALUNO_STEPS;
    case "aluno":
      return ALUNO_STEPS;
    case "":
      return ["CPF"];
    default: {
      const exhaustive: never = tipoPerfil;
      return exhaustive;
    }
  }
}

export function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkingCpf, setCheckingCpf] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [cpfNotice, setCpfNotice] = useState("");

  const isAluno = form.tipoPerfil === "aluno";
  const steps = stepsFor(form.tipoPerfil);
  const currentStepId = steps[step - 1] ?? "cpf";
  const labels = stepLabels(form.tipoPerfil);

  const availableAreas = useMemo(
    () => (form.unidade ? areasDisponiveis(form.unidade) : []),
    [form.unidade],
  );
  const availablePeriodos = useMemo(() => {
    if (!form.area || !form.unidade) return [] as PeriodoCode[];
    return periodosDisponiveis(form.area, form.unidade);
  }, [form.area, form.unidade]);
  const availableDias = useMemo(() => {
    if (!form.area || !form.periodo) return [] as DiaCode[];
    return diasDisponiveis(form.area, form.periodo);
  }, [form.area, form.periodo]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
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
    setForm((current) => {
      if (code === "sab") {
        return { ...current, dias: current.dias.includes("sab") ? [] : ["sab"] };
      }
      if (current.dias.includes(code)) {
        return { ...current, dias: current.dias.filter((dia) => dia !== code) };
      }
      if (current.dias.includes("sab")) {
        return { ...current, dias: [code] };
      }
      if (current.dias.length >= 2) {
        return current;
      }
      return { ...current, dias: [...current.dias, code] };
    });
    setErrors((current) => {
      const next = { ...current };
      delete next.dias;
      return next;
    });
  }

  function selectUnidade(code: UnidadeCode) {
    setForm((current) => ({
      ...current,
      unidade: code,
      area: "",
      periodo: "",
      dias: [],
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next.unidade;
      delete next.area;
      delete next.periodo;
      delete next.dias;
      return next;
    });
  }

  function buildPayload() {
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
        return;
      }

      setSuccess(true);
      setForm(initialForm);
      setStep(1);
      setCpfNotice("");
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    switch (currentStepId) {
      case "cpf":
        void handleCpfSubmit();
        return;
      case "dados":
        if (!validateDados()) return;
        setStep((current) => current + 1);
        return;
      case "faculdade":
        if (!form.faculdade) {
          setErrors({ faculdade: "Selecione a faculdade" });
          return;
        }
        setStep((current) => current + 1);
        return;
      case "unidade":
        if (!form.unidade) {
          setErrors({ unidade: "Selecione uma unidade" });
          return;
        }
        updateField("area", "");
        updateField("periodo", "");
        updateField("dias", []);
        setErrors({});
        setStep((current) => current + 1);
        return;
      case "area":
        if (!form.area) {
          setErrors({ area: "Selecione uma área" });
          return;
        }
        updateField("periodo", "");
        updateField("dias", []);
        setErrors({});
        setStep((current) => current + 1);
        return;
      case "turno":
        if (!form.periodo) {
          setErrors({ periodo: "Selecione um turno" });
          return;
        }
        if (
          form.area &&
          form.unidade &&
          !periodosDisponiveis(form.area, form.unidade).includes(form.periodo)
        ) {
          setErrors({ periodo: "Turno indisponível para esta área nesta unidade" });
          return;
        }
        {
          const diasError = diasSelectionError(form.dias);
          if (diasError) {
            setErrors({ dias: diasError });
            return;
          }
        }
        setErrors({});
        setStep((current) => current + 1);
        return;
      case "confirmar":
        void submitCandidatura();
        return;
      default: {
        const exhaustive: never = currentStepId;
        return exhaustive;
      }
    }
  }

  function goBack() {
    setErrors({});
    setSubmitError("");
    switch (currentStepId) {
      case "unidade":
        updateField("area", "");
        updateField("periodo", "");
        updateField("dias", []);
        break;
      case "area":
        updateField("periodo", "");
        updateField("dias", []);
        break;
      case "cpf":
      case "dados":
      case "faculdade":
      case "turno":
      case "confirmar":
        break;
      default: {
        const exhaustive: never = currentStepId;
        return exhaustive;
      }
    }
    setStep((current) => Math.max(1, current - 1));
  }

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-3xl border border-amet-blue/20 bg-amet-blue/5 p-8 text-center"
      >
        <h2 className="text-2xl font-semibold text-amet-blue">Cadastro realizado</h2>
        <p className="mt-3 text-amet-indigo/70">
          Seu cadastro foi realizado com sucesso, aguarde que entraremos em contato. Obrigado.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/#estagios"
            className="rounded-full bg-amet-purple-contrast px-6 py-3 text-sm font-semibold text-amet-white"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-amet-blue/15 bg-gradient-to-br from-amet-blue/10 via-amet-white to-amet-purple/10 p-6 shadow-lg shadow-amet-blue/10 sm:p-8">
      <Link
        href="/#estagios"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-amet-blue transition hover:text-amet-purple"
      >
        ← Voltar para a página inicial
      </Link>

      <StepIndicator currentStep={step} labels={labels} />

      <div className="mt-8">
        <ApplicationFormSteps
          currentStepId={currentStepId}
          form={form}
          errors={errors}
          cpfNotice={cpfNotice}
          availableAreas={availableAreas}
          availablePeriodos={availablePeriodos}
          availableDias={availableDias}
          updateField={updateField}
          onSelectUnidade={selectUnidade}
          toggleDia={toggleDia}
        />
      </div>

      {submitError && (
        <p
          role="alert"
          aria-live="assertive"
          className="mt-6 rounded-xl border border-amet-purple/40 bg-amet-purple/10 px-4 py-3 text-sm text-amet-purple"
        >
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

        {currentStepId === "confirmar" ? (
          <button
            type="button"
            onClick={() => void submitCandidatura()}
            disabled={submitting}
            className="rounded-full bg-amet-purple-contrast px-6 py-3 text-sm font-semibold text-amet-white hover:bg-amet-blue disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Enviar candidatura"}
          </button>
        ) : (
          <button
            type="button"
            disabled={checkingCpf}
            onClick={() => void goNext()}
            className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-amet-white hover:bg-amet-purple disabled:opacity-60"
          >
            {currentStepId === "cpf" && checkingCpf ? "Verificando CPF..." : "Continuar"}
          </button>
        )}
      </div>
    </div>
  );
}
