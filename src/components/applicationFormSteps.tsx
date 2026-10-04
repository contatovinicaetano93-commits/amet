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
  labelCurso,
  labelEstado,
  labelFormaPagamento,
  labelHorarioFaculdade,
  labelSemestre,
  requiresFormaPagamento,
  type AreaCode,
  type CursoCode,
  type DiaCode,
  type EstadoCode,
  type FaculdadeAceita,
  type FormaPagamentoCode,
  type HorarioFaculdadeCode,
  type PeriodoCode,
  type SemestreValue,
  type TipoPerfil,
  type UnidadeCode,
} from "@/lib/constants";
import { formatBirthDate, formatCep, formatCpf, formatPhone } from "@/lib/validators";

import { Field, SummaryItem, choiceButtonClass, inputClass } from "@/components/applicationFormUi";

export type FormStep =
  | "cpf"
  | "dados"
  | "faculdade"
  | "pagamento"
  | "unidade"
  | "area"
  | "turno"
  | "confirmar";

export type FormState = {
  tipoPerfil: TipoPerfil | "";
  cpf: string;
  nomeCompleto: string;
  rgm: string;
  telefone: string;
  email: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: EstadoCode | "";
  dataNascimento: string;
  horarioFaculdade: HorarioFaculdadeCode | "";
  semestreAtual: SemestreValue | "";
  curso: CursoCode | "";
  faculdade: FaculdadeAceita | "";
  formaPagamento: FormaPagamentoCode | "";
  unidade: UnidadeCode | "";
  area: AreaCode | "";
  periodo: PeriodoCode | "";
  dias: DiaCode[];
};

export const emptyFormState: FormState = {
  tipoPerfil: "",
  cpf: "",
  nomeCompleto: "",
  rgm: "",
  telefone: "",
  email: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cep: "",
  cidade: "",
  estado: "",
  dataNascimento: "",
  horarioFaculdade: "",
  semestreAtual: "",
  curso: "",
  faculdade: "",
  formaPagamento: "",
  unidade: "",
  area: "",
  periodo: "",
  dias: [],
};

export function buildCandidaturaPayload(form: FormState) {
  const shared = {
    nomeCompleto: form.nomeCompleto,
    rgm: form.rgm,
    cpf: form.cpf,
    telefone: form.telefone,
    email: form.email,
    rua: form.rua,
    numero: form.numero,
    complemento: form.complemento,
    bairro: form.bairro,
    cep: form.cep,
    cidade: form.cidade,
    estado: form.estado,
    dataNascimento: form.dataNascimento,
    horarioFaculdade: form.horarioFaculdade,
    semestreAtual: form.semestreAtual,
    curso: form.curso,
    unidade: form.unidade,
    area: form.area,
    periodo: form.periodo,
    dias: form.dias,
  };

  switch (form.tipoPerfil) {
    case "nao_aluno":
      return {
        ...shared,
        tipoPerfil: "nao_aluno" as const,
        faculdade: form.faculdade,
        ...(form.formaPagamento ? { formaPagamento: form.formaPagamento } : {}),
      };
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

type ApplicationFormStepsProps = {
  currentStepId: FormStep;
  form: FormState;
  errors: Record<string, string>;
  cpfNotice: string;
  availableAreas: AreaCode[];
  availablePeriodos: PeriodoCode[];
  availableDias: DiaCode[];
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onSelectUnidade: (code: UnidadeCode) => void;
  onSelectFaculdade: (faculdade: FaculdadeAceita) => void;
  toggleDia: (code: DiaCode) => void;
};

export function ApplicationFormSteps({
  currentStepId,
  form,
  errors,
  cpfNotice,
  availableAreas,
  availablePeriodos,
  availableDias,
  updateField,
  onSelectUnidade,
  onSelectFaculdade,
  toggleDia,
}: ApplicationFormStepsProps) {
  const isAluno = form.tipoPerfil === "aluno";
  const isNaoAluno = form.tipoPerfil === "nao_aluno";

  switch (currentStepId) {
    case "cpf":
      return (
        <div className="space-y-4">
          <p className="text-sm text-amet-indigo/70">
            Informe seu CPF para verificarmos se você é aluno AMET.
          </p>
          <Field id="cpf" label="CPF" error={errors.cpf}>
            <input
              value={form.cpf}
              onChange={(event) => updateField("cpf", formatCpf(event.target.value))}
              className={inputClass(errors.cpf)}
              inputMode="numeric"
              placeholder="000.000.000-00"
            />
          </Field>
        </div>
      );
    case "dados":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {cpfNotice && (
            <p className="sm:col-span-2 rounded-xl border border-amet-blue/25 bg-amet-blue/5 px-4 py-3 text-sm text-amet-indigo/80">
              {cpfNotice}
            </p>
          )}
          <Field id="nomeCompleto" label="Nome completo" error={errors.nomeCompleto} className="sm:col-span-2">
            <input
              value={form.nomeCompleto}
              onChange={(event) => updateField("nomeCompleto", event.target.value)}
              className={inputClass(errors.nomeCompleto)}
            />
          </Field>
          <Field id="rgm" label={isAluno ? "RGM" : "RGM (opcional)"} error={errors.rgm}>
            <input
              value={form.rgm}
              onChange={(event) => updateField("rgm", event.target.value)}
              className={inputClass(errors.rgm)}
            />
          </Field>
          <Field id="email" label="E-mail" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={inputClass(errors.email)}
            />
          </Field>
          <Field id="telefone" label="Telefone / WhatsApp" error={errors.telefone} className="sm:col-span-2">
            <input
              value={form.telefone}
              onChange={(event) => updateField("telefone", formatPhone(event.target.value))}
              className={inputClass(errors.telefone)}
              inputMode="tel"
            />
          </Field>
          <Field id="dataNascimento" label="Data de nascimento" error={errors.dataNascimento}>
            <input
              type="date"
              value={form.dataNascimento}
              onChange={(event) => updateField("dataNascimento", event.target.value)}
              className={inputClass(errors.dataNascimento)}
            />
          </Field>

          <p className="sm:col-span-2 mt-2 text-sm font-semibold text-amet-indigo">Endereço</p>
          <Field id="rua" label="Rua" error={errors.rua} className="sm:col-span-2">
            <input
              value={form.rua}
              onChange={(event) => updateField("rua", event.target.value)}
              className={inputClass(errors.rua)}
            />
          </Field>
          <Field id="numero" label="Número" error={errors.numero}>
            <input
              value={form.numero}
              onChange={(event) => updateField("numero", event.target.value)}
              className={inputClass(errors.numero)}
            />
          </Field>
          <Field id="complemento" label="Complemento (opcional)" error={errors.complemento}>
            <input
              value={form.complemento}
              onChange={(event) => updateField("complemento", event.target.value)}
              className={inputClass(errors.complemento)}
            />
          </Field>
          <Field id="bairro" label="Bairro" error={errors.bairro}>
            <input
              value={form.bairro}
              onChange={(event) => updateField("bairro", event.target.value)}
              className={inputClass(errors.bairro)}
            />
          </Field>
          <Field id="cep" label="CEP" error={errors.cep}>
            <input
              value={form.cep}
              onChange={(event) => updateField("cep", formatCep(event.target.value))}
              className={inputClass(errors.cep)}
              inputMode="numeric"
              placeholder="00000-000"
            />
          </Field>
          <Field id="cidade" label="Cidade" error={errors.cidade}>
            <input
              value={form.cidade}
              onChange={(event) => updateField("cidade", event.target.value)}
              className={inputClass(errors.cidade)}
            />
          </Field>
          <Field id="estado" label="Estado" error={errors.estado}>
            <select
              value={form.estado}
              onChange={(event) => updateField("estado", event.target.value as EstadoCode | "")}
              className={inputClass(errors.estado)}
            >
              <option value="">Selecione</option>
              {ESTADOS_BR.map((estado) => (
                <option key={estado.code} value={estado.code}>
                  {estado.label}
                </option>
              ))}
            </select>
          </Field>

          <p className="sm:col-span-2 mt-2 text-sm font-semibold text-amet-indigo">Dados da faculdade</p>
          <div className="sm:col-span-2 space-y-3">
            <p className="text-sm font-medium text-amet-indigo/80">Horário em que está matriculado na faculdade</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {HORARIOS_FACULDADE.map((horario) => (
                <button
                  key={horario.code}
                  type="button"
                  aria-pressed={form.horarioFaculdade === horario.code}
                  onClick={() => updateField("horarioFaculdade", horario.code)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${choiceButtonClass(
                    form.horarioFaculdade === horario.code,
                  )}`}
                >
                  {horario.label}
                </button>
              ))}
            </div>
            {errors.horarioFaculdade && (
              <p className="text-sm text-amet-purple">{errors.horarioFaculdade}</p>
            )}
          </div>
          <Field id="semestreAtual" label="Semestre atual" error={errors.semestreAtual}>
            <select
              value={form.semestreAtual}
              onChange={(event) =>
                updateField("semestreAtual", event.target.value as SemestreValue | "")
              }
              className={inputClass(errors.semestreAtual)}
            >
              <option value="">Selecione</option>
              {SEMESTRES.map((semestre) => (
                <option key={semestre} value={semestre}>
                  {labelSemestre(semestre)}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2 space-y-3">
            <p className="text-sm font-medium text-amet-indigo/80">Curso</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CURSOS.map((curso) => (
                <button
                  key={curso.code}
                  type="button"
                  aria-pressed={form.curso === curso.code}
                  onClick={() => updateField("curso", curso.code)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${choiceButtonClass(
                    form.curso === curso.code,
                  )}`}
                >
                  {curso.label}
                </button>
              ))}
            </div>
            {errors.curso && <p className="text-sm text-amet-purple">{errors.curso}</p>}
          </div>
        </div>
      );
    case "faculdade":
      return (
        <div className="space-y-4">
          <p className="text-sm text-amet-indigo/70">Selecione a faculdade de origem.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {FACULDADES.map((faculdade) => (
              <button
                key={faculdade}
                type="button"
                aria-pressed={form.faculdade === faculdade}
                onClick={() => onSelectFaculdade(faculdade)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${choiceButtonClass(
                  form.faculdade === faculdade,
                )}`}
              >
                {faculdade}
              </button>
            ))}
          </div>
          {errors.faculdade && <p className="text-sm text-amet-purple">{errors.faculdade}</p>}
        </div>
      );
    case "pagamento":
      return (
        <div className="space-y-4">
          <p className="text-sm text-amet-indigo/70">
            Selecione a forma de pagamento. Esta etapa apenas registra a escolha — nenhum
            pagamento é cobrado agora.
          </p>
          <div className="grid gap-3">
            {FORMAS_PAGAMENTO.map((forma) => (
              <button
                key={forma.code}
                type="button"
                aria-pressed={form.formaPagamento === forma.code}
                onClick={() => updateField("formaPagamento", forma.code)}
                className={`rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${choiceButtonClass(
                  form.formaPagamento === forma.code,
                )}`}
              >
                {forma.label}
              </button>
            ))}
          </div>
          {errors.formaPagamento && (
            <p className="text-sm text-amet-purple">{errors.formaPagamento}</p>
          )}
        </div>
      );
    case "unidade":
      return (
        <div className="space-y-4">
          <p className="text-sm text-amet-indigo/70">Selecione sua unidade.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {UNIDADES.map((unidade) => (
              <button
                key={unidade.code}
                type="button"
                aria-pressed={form.unidade === unidade.code}
                onClick={() => onSelectUnidade(unidade.code)}
                className={`rounded-2xl border px-4 py-4 font-medium transition ${choiceButtonClass(
                  form.unidade === unidade.code,
                )}`}
              >
                {unidade.label}
              </button>
            ))}
          </div>
          {errors.unidade && <p className="text-sm text-amet-purple">{errors.unidade}</p>}
        </div>
      );
    case "area":
      return (
        <div className="space-y-4">
          <p className="text-sm text-amet-indigo/70">
            Escolha a área disponível na unidade{" "}
            {UNIDADES.find((unidade) => unidade.code === form.unidade)?.label}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {availableAreas.map((code) => {
              const selected = form.area === code;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => updateField("area", code)}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    selected
                      ? "border-amet-purple bg-amet-purple/5 shadow-md shadow-amet-purple/10"
                      : "border-amet-blue/15 bg-amet-white hover:border-amet-blue hover:shadow-sm"
                  }`}
                >
                  <p className="text-lg font-bold text-amet-indigo">{AREAS[code].label}</p>
                </button>
              );
            })}
          </div>
          {errors.area && <p className="text-sm text-amet-purple">{errors.area}</p>}
        </div>
      );
    case "turno":
      if (!form.area || !form.unidade) return null;
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-amet-indigo/70">
              Escolha o turno disponível para {AREAS[form.area].label} em{" "}
              {UNIDADES.find((unidade) => unidade.code === form.unidade)?.label}.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {availablePeriodos.map((periodo) => {
                const label = PERIODOS.find((item) => item.code === periodo)?.label ?? periodo;
                const selected = form.periodo === periodo;
                return (
                  <button
                    key={periodo}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      updateField("periodo", periodo);
                      updateField("dias", []);
                    }}
                    className={`rounded-2xl border px-4 py-4 font-medium transition ${
                      selected
                        ? "border-amet-blue bg-amet-blue/10 text-amet-blue"
                        : "border-amet-indigo/15 text-amet-indigo/80 hover:border-amet-purple"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.periodo && <p className="text-sm text-amet-purple">{errors.periodo}</p>}
          </div>

          {form.periodo && (
            <div className="space-y-3">
              <p className="text-sm text-amet-indigo/70">
                Escolha exatamente 2 dias — ou apenas Sábado (sozinho). Não é
                possível escolher 1 dia útil nem 3 dias.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {availableDias.map((dia) => {
                  const label = DIAS.find((item) => item.code === dia)?.label ?? dia;
                  const selected = form.dias.includes(dia);
                  const disabled =
                    !selected &&
                    dia !== "sab" &&
                    (form.dias.includes("sab") || form.dias.length >= 2);
                  return (
                    <button
                      key={dia}
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      onClick={() => toggleDia(dia)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${choiceButtonClass(
                        selected,
                        disabled,
                      )}`}
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
      );
    case "confirmar":
      return (
        <div className="space-y-4">
          <p className="text-sm text-amet-indigo/70">Confirme os dados antes de enviar.</p>
          <dl className="grid gap-4 rounded-2xl border border-amet-blue/15 bg-amet-white p-5 sm:grid-cols-2">
            <SummaryItem label="Nome" value={form.nomeCompleto} />
            <SummaryItem label="RGM" value={form.rgm} />
            <SummaryItem label="CPF" value={form.cpf} />
            <SummaryItem label="Telefone" value={form.telefone} />
            <SummaryItem label="E-mail" value={form.email} className="sm:col-span-2" />
            <SummaryItem label="Data de nascimento" value={formatBirthDate(form.dataNascimento)} />
            <SummaryItem label="Curso" value={form.curso ? labelCurso(form.curso) : ""} />
            <SummaryItem
              label="Horário da faculdade"
              value={form.horarioFaculdade ? labelHorarioFaculdade(form.horarioFaculdade) : ""}
            />
            <SummaryItem
              label="Semestre atual"
              value={form.semestreAtual ? labelSemestre(form.semestreAtual) : ""}
            />
            <SummaryItem
              label="Endereço"
              value={[
                [form.rua, form.numero].filter(Boolean).join(", "),
                form.complemento,
                form.bairro,
                form.cep,
                [form.cidade, form.estado ? labelEstado(form.estado) : ""].filter(Boolean).join(" / "),
              ]
                .filter(Boolean)
                .join(" — ")}
              className="sm:col-span-2"
            />
            {isNaoAluno && (
              <SummaryItem label="Faculdade" value={form.faculdade} className="sm:col-span-2" />
            )}
            {isNaoAluno && form.faculdade && requiresFormaPagamento(form.faculdade) && (
              <SummaryItem
                label="Forma de pagamento"
                value={form.formaPagamento ? labelFormaPagamento(form.formaPagamento) : ""}
                className="sm:col-span-2"
              />
            )}
            <SummaryItem
              label="Unidade"
              value={UNIDADES.find((unidade) => unidade.code === form.unidade)?.label ?? ""}
            />
            <SummaryItem label="Área" value={form.area ? AREAS[form.area].label : ""} />
            <SummaryItem
              label="Turno"
              value={PERIODOS.find((periodo) => periodo.code === form.periodo)?.label ?? ""}
            />
            <SummaryItem
              label="Dias"
              value={form.dias.map((dia) => DIAS.find((item) => item.code === dia)?.label ?? dia).join(", ")}
              className="sm:col-span-2"
            />
          </dl>
        </div>
      );
    default: {
      const exhaustive: never = currentStepId;
      return exhaustive;
    }
  }
}
