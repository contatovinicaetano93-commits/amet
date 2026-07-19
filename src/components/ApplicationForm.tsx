"use client";

import { useCallback, useEffect, useState } from "react";

import { AreaCard, type VacancyInfo } from "@/components/AreaCard";
import { StepIndicator } from "@/components/StepIndicator";
import {
  CURSOS,
  FORM_STEPS,
  POLLING_INTERVAL_MS,
  UNIDADES,
  type AreaCode,
  type TipoPerfil,
  type UnidadeCode,
} from "@/lib/constants";
import { candidaturaSchema, personalDataSchema } from "@/lib/schemas";
import { formatCpf, formatPhone, isValidCpf, stripDigits } from "@/lib/validators";

type FormState = {
  tipoPerfil: TipoPerfil | "";
  nomeCompleto: string;
  rgm: string;
  cpf: string;
  telefone: string;
  email: string;
  unidades: UnidadeCode[];
  cursoAtual: (typeof CURSOS)[number] | "";
  areasInteresse: AreaCode[];
};

const initialForm: FormState = {
  tipoPerfil: "",
  nomeCompleto: "",
  rgm: "",
  cpf: "",
  telefone: "",
  email: "",
  unidades: [],
  cursoAtual: "",
  areasInteresse: [],
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
  const [cpfNotice, setCpfNotice] = useState("");
  const [checkingCpf, setCheckingCpf] = useState(false);

  const isAluno = form.tipoPerfil === "aluno";
  const enforceLimit = isAluno;

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
    const interval = setInterval(() => void fetchVagas(), POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchVagas]);

  useEffect(() => {
    if (!enforceLimit || form.areasInteresse.length !== 1) return;
    const selected = areas.find((a) => a.code === form.areasInteresse[0]);
    if (selected?.full) setForm((c) => ({ ...c, areasInteresse: [] }));
  }, [areas, form.areasInteresse, enforceLimit]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => { const n = { ...c }; delete n[key as string]; return n; });
  }

  function toggleUnidade(code: UnidadeCode) {
    if (isAluno) {
      updateField("unidades", [code]);
      return;
    }
    setForm((c) => ({
      ...c,
      unidades: c.unidades.includes(code)
        ? c.unidades.filter((u) => u !== code)
        : [...c.unidades, code],
    }));
    setErrors((c) => { const n = { ...c }; delete n.unidades; return n; });
  }

  function toggleArea(code: AreaCode) {
    if (isAluno) {
      const area = areas.find((a) => a.code === code);
      if (area?.full) return;
      updateField("areasInteresse", [code]);
      return;
    }
    setForm((c) => ({
      ...c,
      areasInteresse: c.areasInteresse.includes(code)
        ? c.areasInteresse.filter((a) => a !== code)
        : [...c.areasInteresse, code],
    }));
    setErrors((c) => { const n = { ...c }; delete n.areasInteresse; return n; });
  }

  async function verifyAlunoCpf(): Promise<boolean> {
    if (form.tipoPerfil !== "aluno") {
      return true;
    }

    if (!isValidCpf(form.cpf)) {
      setErrors({ cpf: "CPF inválido" });
      return false;
    }

    setCheckingCpf(true);
    try {
      const response = await fetch("/api/participantes/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: stripDigits(form.cpf) }),
      });
      const data = (await response.json()) as { error?: string; found?: boolean };

      if (!response.ok) {
        setErrors({ cpf: data.error ?? "Não foi possível verificar o CPF." });
        return false;
      }

      if (!data.found) {
        updateField("tipoPerfil", "nao_aluno");
        setCpfNotice(
          "CPF não encontrado na base de alunos AMET. Seguiremos no fluxo de não aluno — você pode continuar.",
        );
      } else {
        setCpfNotice("");
      }
      return true;
    } catch {
      setErrors({ cpf: "Erro de conexão ao verificar o CPF." });
      return false;
    } finally {
      setCheckingCpf(false);
    }
  }

  function validateStep(s: number): boolean {
    if (s === 1) {
      if (!form.tipoPerfil) {
        setErrors({ tipoPerfil: "Informe se você é aluno ou não aluno" });
        return false;
      }
      setErrors({});
      return true;
    }
    if (s === 2) {
      const result = personalDataSchema.safeParse(form);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return false;
      }
      if (form.tipoPerfil === "aluno" && !form.rgm.trim()) {
        setErrors({ rgm: "Informe seu RGM" });
        return false;
      }
      setErrors({});
      return true;
    }
    if (s === 3) {
      if (form.unidades.length === 0) {
        setErrors({ unidades: isAluno ? "Selecione uma unidade" : "Selecione ao menos uma unidade" });
        return false;
      }
      if (isAluno && form.unidades.length > 1) {
        setErrors({ unidades: "Selecione apenas uma unidade" });
        return false;
      }
      setErrors({});
      return true;
    }
    if (s === 4) {
      if (!form.cursoAtual) {
        setErrors({ cursoAtual: "Selecione um curso" });
        return false;
      }
      setErrors({});
      return true;
    }
    if (s === 5) {
      if (form.areasInteresse.length === 0) {
        setErrors({ areasInteresse: "Selecione ao menos uma área" });
        return false;
      }
      if (isAluno && form.areasInteresse.length > 1) {
        setErrors({ areasInteresse: "Selecione apenas uma área" });
        return false;
      }
      if (isAluno) {
        const area = areas.find((a) => a.code === form.areasInteresse[0]);
        if (area?.full) {
          setErrors({ areasInteresse: "Esta área está com vagas esgotadas" });
          return false;
        }
      }
      setErrors({});
      return true;
    }
    return false;
  }

  async function handleSubmit() {
    if (!validateStep(5)) return;
    const parsed = candidaturaSchema.safeParse({
      ...form,
      tipoPerfil: form.tipoPerfil,
      cursoAtual: form.cursoAtual || undefined,
    });
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
      void fetchVagas();
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-amet-blue/20 bg-amet-blue/5 p-8 text-center">
        <h2 className="text-2xl font-semibold text-amet-blue">Inscrição registrada!</h2>
        <p className="mt-3 text-amet-indigo/70">
          Recebemos sua candidatura. A AMET entrará em contato pelo e-mail informado.
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
      <StepIndicator currentStep={step} labels={FORM_STEPS} />

      <div className="mt-8">
        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm text-amet-indigo/70">Você é aluno da AMET?</p>
            {(["aluno", "nao_aluno"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => {
                  updateField("tipoPerfil", tipo);
                  setCpfNotice("");
                }}
                className={`rounded-2xl border px-4 py-4 text-left font-medium transition ${
                  form.tipoPerfil === tipo
                    ? "border-amet-blue bg-amet-blue/10 text-amet-blue"
                    : "border-amet-indigo/15 text-amet-indigo/80 hover:border-amet-purple"
                }`}
              >
                {tipo === "aluno" ? "Sou aluno AMET" : "Não sou aluno AMET"}
              </button>
            ))}
            {errors.tipoPerfil && <p className="sm:col-span-2 text-sm text-amet-purple">{errors.tipoPerfil}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" error={errors.nomeCompleto} className="sm:col-span-2">
              <input value={form.nomeCompleto} onChange={(e) => updateField("nomeCompleto", e.target.value)} className={inputClass(errors.nomeCompleto)} />
            </Field>
            <Field
              label={isAluno ? "RGM" : "RGM (opcional)"}
              error={errors.rgm}
            >
              <input value={form.rgm} onChange={(e) => updateField("rgm", e.target.value)} className={inputClass(errors.rgm)} />
            </Field>
            <Field label="CPF" error={errors.cpf}>
              <input
                value={form.cpf}
                onChange={(e) => {
                  updateField("cpf", formatCpf(e.target.value));
                  setCpfNotice("");
                }}
                className={inputClass(errors.cpf)}
                inputMode="numeric"
              />
            </Field>
            <Field label="Telefone / WhatsApp" error={errors.telefone}>
              <input value={form.telefone} onChange={(e) => updateField("telefone", formatPhone(e.target.value))} className={inputClass(errors.telefone)} inputMode="tel" />
            </Field>
            <Field label="E-mail" error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass(errors.email)} />
            </Field>
          </div>
        )}

        {cpfNotice && step >= 2 && (
          <p className="mt-4 rounded-xl border border-amet-blue/25 bg-amet-blue/5 px-4 py-3 text-sm text-amet-indigo/80">
            {cpfNotice}
          </p>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-amet-indigo/70">
              {isAluno ? "Selecione sua unidade." : "Selecione uma ou mais unidades de interesse."}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {UNIDADES.map((u) => (
                <button
                  key={u.code}
                  type="button"
                  onClick={() => toggleUnidade(u.code)}
                  className={`rounded-2xl border px-4 py-4 font-medium transition ${
                    form.unidades.includes(u.code)
                      ? "border-amet-purple bg-amet-purple/10 text-amet-purple"
                      : "border-amet-indigo/15 text-amet-indigo/80 hover:border-amet-blue"
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
            {errors.unidades && <p className="text-sm text-amet-purple">{errors.unidades}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-amet-indigo/70">Selecione seu curso na AMET.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CURSOS.map((curso) => (
                <button
                  key={curso}
                  type="button"
                  onClick={() => updateField("cursoAtual", curso)}
                  className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                    form.cursoAtual === curso
                      ? "border-amet-blue bg-amet-blue/10 text-amet-blue"
                      : "border-amet-indigo/15 text-amet-indigo/80 hover:border-amet-purple"
                  }`}
                >
                  {curso}
                </button>
              ))}
            </div>
            {errors.cursoAtual && <p className="text-sm text-amet-purple">{errors.cursoAtual}</p>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-amet-indigo/70">
              {isAluno
                ? "Escolha uma área. Vagas esgotadas não permitem candidatura."
                : "Escolha uma ou mais áreas de interesse."}
            </p>
            {loadingVagas ? (
              <p className="text-sm text-amet-indigo/50">
                {isAluno ? "Carregando vagas..." : "Carregando áreas..."}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {areas.map((area) => (
                  <AreaCard
                    key={area.code}
                    area={area}
                    selected={form.areasInteresse.includes(area.code)}
                    onSelect={toggleArea}
                    multi={!isAluno}
                    enforceLimit={enforceLimit}
                    showVacancyCount={isAluno}
                  />
                ))}
              </div>
            )}
            {errors.areasInteresse && <p className="text-sm text-amet-purple">{errors.areasInteresse}</p>}
          </div>
        )}
      </div>

      {submitError && (
        <p className="mt-6 rounded-xl border border-amet-purple/40 bg-amet-purple/10 px-4 py-3 text-sm text-amet-purple">{submitError}</p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <button type="button" onClick={() => { setErrors({}); setStep((s) => s - 1); }} className="rounded-full border border-amet-indigo/20 px-6 py-3 text-sm text-amet-indigo/70 hover:border-amet-blue hover:text-amet-blue">
            Voltar
          </button>
        ) : <span />}
        {step < 5 ? (
          <button
            type="button"
            disabled={checkingCpf}
            onClick={() => {
              void (async () => {
                if (!validateStep(step)) return;
                if (step === 2 && !(await verifyAlunoCpf())) return;
                setStep((s) => s + 1);
              })();
            }}
            className="rounded-full bg-amet-blue px-6 py-3 text-sm font-semibold text-amet-white hover:bg-amet-purple disabled:opacity-60"
          >
            {checkingCpf ? "Verificando CPF..." : "Continuar"}
          </button>
        ) : (
          <button type="button" onClick={() => void handleSubmit()} disabled={submitting} className="rounded-full bg-amet-purple px-6 py-3 text-sm font-semibold text-amet-white hover:bg-amet-blue disabled:opacity-60">
            {submitting ? "Enviando..." : "Enviar candidatura"}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, className, children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
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
