"use client";

import { useCallback, useEffect, useState } from "react";

import { AREAS, UNIDADES, PERIODOS, type AreaCode, type UnidadeCode, type Periodo } from "@/lib/constants";
import { cpfSchema, leadSchema, candidaturaSchema } from "@/lib/schemas";
import { formatCpf, stripDigits } from "@/lib/validators";

type FormStep = "cpf" | "data" | "unidade" | "area" | "confirm" | "success";
type FlowType = "student" | "lead" | null;

interface StudentData {
  nome: string;
  email: string;
  telefone: string;
  rgm: string;
}

export function ApplicationForm() {
  const [step, setStep] = useState<FormStep>("cpf");
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [cpf, setCpf] = useState("");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [unidade, setUnidade] = useState<UnidadeCode | "">("");
  const [area, setArea] = useState<AreaCode | "">("");
  const [periodo, setPeriodo] = useState<Periodo | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");

  const validateCpf = async (cpfValue: string) => {
    const stripped = stripDigits(cpfValue);
    const result = cpfSchema.safeParse({ cpf: stripped });

    if (!result.success) {
      setErrors({ cpf: "CPF inválido" });
      return;
    }

    setErrors({});
    setCpf(stripped);

    try {
      const response = await fetch(`/api/student?cpf=${stripped}`);
      const data = (await response.json()) as {
        isStudent: boolean;
        student?: StudentData;
      };

      if (data.isStudent && data.student) {
        setFlowType("student");
        setStudentData(data.student);
        setStep("data");
      } else {
        setFlowType("lead");
        setStep("data");
      }
    } catch {
      setErrors({ cpf: "Erro ao validar CPF" });
    }
  };

  const handleCpfSubmit = () => {
    if (!cpf) {
      setErrors({ cpf: "Informe seu CPF" });
      return;
    }
    void validateCpf(cpf);
  };

  const handleLeadDataSubmit = () => {
    if (!leadName || !leadEmail || !leadPhone) {
      setErrors({
        leadName: !leadName ? "Informe seu nome" : "",
        leadEmail: !leadEmail ? "Informe seu email" : "",
        leadPhone: !leadPhone ? "Informe seu telefone" : "",
      });
      return;
    }

    const leadResult = leadSchema.safeParse({
      cpf,
      nomeCompleto: leadName,
      email: leadEmail,
      telefone: leadPhone,
    });

    if (!leadResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of leadResult.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setStep("confirm");
  };

  const handleUnidadeSelect = (u: UnidadeCode) => {
    setUnidade(u);
    setStep("area");
  };

  const handleAreaSelect = (a: AreaCode) => {
    setArea(a);
    setStep("area");
  };

  const handlePeriodoSelect = (p: Periodo) => {
    setPeriodo(p);
    setStep("confirm");
  };

  const handleStudentSubmit = async () => {
    if (flowType !== "student" || !studentData) return;

    const candidaturaResult = candidaturaSchema.safeParse({
      cpf,
      nomeCompleto: studentData.nome,
      rgm: studentData.rgm,
      email: studentData.email,
      telefone: studentData.telefone,
      unidade,
      areaInteresse: area,
      periodo,
    });

    if (!candidaturaResult.success) {
      setErrors({ submit: "Dados inválidos" });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/candidaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidaturaResult.data),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setErrors({ submit: data.error || "Erro ao enviar candidatura" });
        setSubmitting(false);
        return;
      }

      setStep("success");
    } catch {
      setErrors({ submit: "Erro de conexão" });
      setSubmitting(false);
    }
  };

  const handleLeadSubmit = async () => {
    if (flowType !== "lead") return;

    const leadResult = leadSchema.safeParse({
      cpf,
      nomeCompleto: leadName,
      email: leadEmail,
      telefone: leadPhone,
    });

    if (!leadResult.success) {
      setErrors({ submit: "Dados inválidos" });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadResult.data),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setErrors({ submit: data.error || "Erro ao registrar" });
        setSubmitting(false);
        return;
      }

      setStep("success");
    } catch {
      setErrors({ submit: "Erro de conexão" });
      setSubmitting(false);
    }
  };

  if (step === "success") {
    return (
      <div className="rounded-3xl border border-amet-blue/30 bg-amet-blue/10 p-8 text-center">
        <h2 className="text-2xl font-semibold text-amet-blue">
          {flowType === "student"
            ? "Candidatura enviada com sucesso!"
            : "Obrigado pelo seu interesse!"}
        </h2>
        <p className="mt-3 text-amet-white/75">
          {flowType === "student"
            ? "Recebemos sua inscrição. A AMET entrará em contato pelo e-mail informado."
            : "Em breve entraremos em contato para discutir oportunidades de estágio."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-amet-white/15 bg-amet-white/5 p-6 shadow-2xl shadow-amet-indigo/50 backdrop-blur-sm sm:p-8">
      {/* CPF Step */}
      {step === "cpf" && (
        <div className="space-y-6">
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold text-amet-white">
              Inscrição para Estágios 2027
            </h2>
            <p className="text-sm text-amet-white/65">
              Comece informando seu CPF para verificarmos se você é aluno AMET.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-amet-white/80">
              CPF
            </label>
            <input
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              className={`w-full rounded-xl border bg-amet-indigo/60 px-4 py-3 text-amet-white outline-none transition placeholder:text-amet-white/35 ${
                errors.cpf
                  ? "border-amet-purple focus:border-amet-purple"
                  : "border-amet-white/20 focus:border-amet-blue"
              }`}
              inputMode="numeric"
            />
            {errors.cpf && (
              <p className="text-sm text-amet-purple">{errors.cpf}</p>
            )}
          </div>

          <button
            onClick={handleCpfSubmit}
            className="amet-grad-btn w-full rounded-full px-6 py-3 text-sm font-semibold text-amet-white"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Student Data Step */}
      {step === "data" && flowType === "student" && studentData && (
        <div className="space-y-6">
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold text-amet-white">
              Seus Dados
            </h2>
            <p className="text-sm text-amet-white/65">
              Verificamos seus dados no sistema AMET.
            </p>
          </div>

          <div className="space-y-4">
            <Field label="Nome" value={studentData.nome} readonly />
            <Field label="RGM" value={studentData.rgm} readonly />
            <Field label="E-mail" value={studentData.email} readonly />
            <Field
              label="Telefone"
              value={studentData.telefone}
              readonly
            />
          </div>

          <button
            onClick={() => setStep("unidade")}
            className="amet-grad-btn w-full rounded-full px-6 py-3 text-sm font-semibold text-amet-white"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Lead Data Step */}
      {step === "data" && flowType === "lead" && (
        <div className="space-y-6">
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold text-amet-white">
              Seus Dados
            </h2>
            <p className="text-sm text-amet-white/65">
              Não encontramos você na base de alunos AMET. Preencha seus dados.
            </p>
          </div>

          <div className="space-y-4">
            <Field label="Nome completo" error={errors.leadName}>
              <input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Seu nome completo"
                className={`w-full rounded-xl border bg-amet-indigo/60 px-4 py-3 text-amet-white outline-none transition placeholder:text-amet-white/35 ${
                  errors.leadName
                    ? "border-amet-purple focus:border-amet-purple"
                    : "border-amet-white/20 focus:border-amet-blue"
                }`}
              />
            </Field>
            <Field label="E-mail" error={errors.leadEmail}>
              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="seu@email.com"
                className={`w-full rounded-xl border bg-amet-indigo/60 px-4 py-3 text-amet-white outline-none transition placeholder:text-amet-white/35 ${
                  errors.leadEmail
                    ? "border-amet-purple focus:border-amet-purple"
                    : "border-amet-white/20 focus:border-amet-blue"
                }`}
              />
            </Field>
            <Field label="Telefone / WhatsApp" error={errors.leadPhone}>
              <input
                value={leadPhone}
                onChange={(e) => setLeadPhone(formatCpf(e.target.value))}
                placeholder="(11) 99999-9999"
                className={`w-full rounded-xl border bg-amet-indigo/60 px-4 py-3 text-amet-white outline-none transition placeholder:text-amet-white/35 ${
                  errors.leadPhone
                    ? "border-amet-purple focus:border-amet-purple"
                    : "border-amet-white/20 focus:border-amet-blue"
                }`}
                inputMode="tel"
              />
            </Field>
          </div>

          <button
            onClick={handleLeadDataSubmit}
            className="amet-grad-btn w-full rounded-full px-6 py-3 text-sm font-semibold text-amet-white"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Unidade Step */}
      {step === "unidade" && (
        <div className="space-y-6">
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold text-amet-white">
              Selecione uma Unidade
            </h2>
            <p className="text-sm text-amet-white/65">
              Escolha a unidade onde deseja fazer estágio.
            </p>
          </div>

          <div className="grid gap-4">
            {Object.entries(UNIDADES).map(([code, u]) => (
              <button
                key={code}
                onClick={() => handleUnidadeSelect(code as UnidadeCode)}
                className={`rounded-2xl border px-6 py-4 text-left font-medium transition ${
                  unidade === code
                    ? "border-amet-blue bg-amet-blue/15 text-amet-blue"
                    : "border-amet-white/20 bg-amet-white/5 text-amet-white/80 hover:border-amet-purple"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Area + Periodo Step */}
      {step === "area" && (
        <div className="space-y-6">
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold text-amet-white">
              Área de Interesse e Período
            </h2>
            <p className="text-sm text-amet-white/65">
              Selecione a área e o turno desejado.
            </p>
          </div>

          {!area ? (
            <div className="space-y-4">
              <p className="text-sm text-amet-white/75 font-medium">
                Área de Estágio
              </p>
              {Object.entries(AREAS).map(([code, a]) => {
                const areaWithUnidades = a as any;
                const availableInUnit =
                  !areaWithUnidades.unidadesDisponiveis ||
                  areaWithUnidades.unidadesDisponiveis.includes(unidade as string);

                if (!availableInUnit) return null;

                return (
                  <button
                    key={code}
                    onClick={() => handleAreaSelect(code as AreaCode)}
                    className="rounded-2xl border px-6 py-4 text-left font-medium transition border-amet-white/20 bg-amet-white/5 text-amet-white/80 hover:border-amet-blue"
                  >
                    <div className="font-semibold">{a.label}</div>
                    <div className="text-sm text-amet-white/60 mt-1">
                      {a.dias}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-amet-blue/30 bg-amet-blue/10 p-4">
                <p className="text-sm text-amet-white/75">Área selecionada:</p>
                <p className="text-lg font-semibold text-amet-blue">
                  {AREAS[area].label}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-amet-white/75 font-medium">
                  Período
                </p>
                {AREAS[area].periodos.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodoSelect(p as Periodo)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left font-medium transition ${
                      periodo === p
                        ? "border-amet-blue bg-amet-blue/15 text-amet-blue"
                        : "border-amet-white/20 bg-amet-white/5 text-amet-white/80 hover:border-amet-purple"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setArea("")}
                className="w-full rounded-full border border-amet-white/25 px-6 py-3 text-sm font-medium text-amet-white/80 transition hover:border-amet-blue hover:text-amet-blue"
              >
                Voltar para Áreas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm Step */}
      {step === "confirm" && (
        <div className="space-y-6">
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold text-amet-white">
              Confirme seus Dados
            </h2>
          </div>

          <div className="space-y-4 rounded-2xl border border-amet-white/15 bg-amet-white/5 p-6">
            {flowType === "student" && studentData && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-amet-white/60">Nome</p>
                    <p className="text-sm font-semibold text-amet-white">
                      {studentData.nome}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-amet-white/60">RGM</p>
                    <p className="text-sm font-semibold text-amet-white">
                      {studentData.rgm}
                    </p>
                  </div>
                </div>
              </>
            )}

            {flowType === "lead" && (
              <>
                <div>
                  <p className="text-xs text-amet-white/60">Nome</p>
                  <p className="text-sm font-semibold text-amet-white">
                    {leadName}
                  </p>
                </div>
              </>
            )}

            <div>
              <p className="text-xs text-amet-white/60">Unidade</p>
              <p className="text-sm font-semibold text-amet-white">
                {UNIDADES[unidade as UnidadeCode]?.label}
              </p>
            </div>

            {flowType === "student" && (
              <>
                <div>
                  <p className="text-xs text-amet-white/60">Área</p>
                  <p className="text-sm font-semibold text-amet-white">
                    {AREAS[area as AreaCode]?.label}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-amet-white/60">Período</p>
                  <p className="text-sm font-semibold text-amet-white">
                    {periodo}
                  </p>
                </div>
              </>
            )}
          </div>

          {errors.submit && (
            <p className="rounded-xl border border-amet-purple/40 bg-amet-purple/10 px-4 py-3 text-sm text-amet-purple">
              {errors.submit}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              onClick={() => setStep(flowType === "student" ? "area" : "data")}
              className="rounded-full border border-amet-white/25 px-6 py-3 text-sm font-medium text-amet-white/80 transition hover:border-amet-blue hover:text-amet-blue"
            >
              Voltar
            </button>
            <button
              onClick={
                flowType === "student" ? handleStudentSubmit : handleLeadSubmit
              }
              disabled={submitting}
              className="amet-grad-btn rounded-full px-6 py-3 text-sm font-semibold text-amet-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Enviando..."
                : flowType === "student"
                  ? "Enviar Candidatura"
                  : "Registrar Lead"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  readonly,
  error,
  children,
}: {
  label: string;
  value?: string;
  readonly?: boolean;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-amet-white/80">{label}</span>
      {children || (
        <input
          value={value}
          readOnly={readonly}
          className={`w-full rounded-xl border bg-amet-indigo/60 px-4 py-3 text-amet-white outline-none transition placeholder:text-amet-white/35 ${
            readonly
              ? "border-amet-blue/50 bg-amet-indigo/40 text-amet-blue cursor-not-allowed"
              : "border-amet-white/20 focus:border-amet-blue"
          }`}
        />
      )}
      {error && <span className="block text-sm text-amet-purple">{error}</span>}
    </label>
  );
}
