"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { classManagePath } from "@/lib/ava/navigation";
import { roleLabel } from "@/lib/ava/permissions";
import type { UserRole } from "@/lib/ava/schema";
import {
  SHIFT_GUIDE,
  SHIFTS,
  allowedShiftsForSubject,
  shiftCodes,
  shiftLabel,
  type ShiftCode,
} from "@/lib/ava/shifts";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type InviteRow = {
  id: string;
  email: string;
  role: UserRole;
  expiresAt: string;
  usedAt: string | null;
};

type SubjectRow = { id: string; name: string; slug: string };

type ClassRow = {
  id: string;
  name: string;
  shift: string | null;
  subjectId: string;
  subjectName: string;
  teacherId: string | null;
  teacherName: string | null;
};

type AdminPanelProps = {
  currentUserId: string;
  initialUsers: UserRow[];
  initialInvites: InviteRow[];
  initialSubjects: SubjectRow[];
  initialClasses: ClassRow[];
  storageConfigured: boolean;
  missingStorageKeys: string[];
  emailConfigured: boolean;
};

export function AdminPanel({
  currentUserId,
  initialUsers,
  initialInvites,
  initialSubjects,
  initialClasses,
  storageConfigured,
  missingStorageKeys,
  emailConfigured,
}: AdminPanelProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [invites, setInvites] = useState(initialInvites);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [classes, setClasses] = useState(initialClasses);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedShift, setSelectedShift] = useState<ShiftCode | "">("");
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState("");
  const [editClassShift, setEditClassShift] = useState<ShiftCode | "">("");
  const [editClassTeacherId, setEditClassTeacherId] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | "all">(
    "all",
  );
  const [inviteRoleFilter, setInviteRoleFilter] = useState<UserRole | "all">(
    "all",
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  useEffect(() => {
    setInvites(initialInvites);
  }, [initialInvites]);
  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);
  useEffect(() => {
    setClasses(initialClasses);
  }, [initialClasses]);

  const selectedSubjectName =
    subjects.find((item) => item.id === selectedSubjectId)?.name ?? "";
  const availableShifts = useMemo(
    () =>
      selectedSubjectName
        ? allowedShiftsForSubject(selectedSubjectName)
        : ([] as ShiftCode[]),
    [selectedSubjectName],
  );
  const activeEmails = useMemo(
    () => new Set(users.map((user) => user.email.toLowerCase())),
    [users],
  );

  async function copyInviteUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
    }
  }

  function applyInviteResponse(data: {
    emailSent?: boolean;
    warning?: string;
    inviteUrl?: string;
    invite?: {
      id: string;
      email: string;
      role: UserRole;
      expiresAt: string;
    };
  }) {
    setInviteUrl(data.inviteUrl ?? "");
    setInviteRole(data.invite?.role ?? null);
    setCopyState("idle");
    setMessage(
      data.emailSent
        ? `Convite criado e e-mail enviado para ${data.invite?.email ?? "o destinatário"} com o link de ativação.`
        : "Convite criado. O e-mail não saiu — copie o link abaixo e envie manualmente.",
    );
    setError(data.warning ? String(data.warning) : "");
    if (data.invite) {
      setInvites((current) => [
        {
          id: data.invite!.id,
          email: data.invite!.email,
          role: data.invite!.role,
          expiresAt: data.invite!.expiresAt,
          usedAt: null,
        },
        ...current.filter(
          (invite) =>
            invite.email !== data.invite!.email || invite.usedAt !== null,
        ),
      ]);
    }
  }

  function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const role = String(form.get("role") ?? "aluno") as UserRole;
    if (
      role === "admin" &&
      !window.confirm(
        "Tem certeza? Esta pessoa terá acesso total de administrador.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      setMessage("");
      setError("");
      setInviteUrl("");
      setInviteRole(null);
      try {
        const response = await fetch("/api/ava/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.get("email"),
            role,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao criar convite.");
          return;
        }

        applyInviteResponse(data);
        formEl.reset();
        router.refresh();
      } catch {
        setError("Falha de rede ao criar convite. Tente novamente.");
      }
    });
  }

  function regenerateInvite(invite: InviteRow) {
    startTransition(async () => {
      setMessage("");
      setError("");
      setInviteUrl("");
      setInviteRole(null);
      try {
        const response = await fetch("/api/ava/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: invite.email,
            role: invite.role,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao gerar novo link.");
          return;
        }
        applyInviteResponse(data);
        router.refresh();
      } catch {
        setError("Falha de rede ao gerar novo link.");
      }
    });
  }

  function cancelInvite(invite: InviteRow) {
    const accepted = Boolean(invite.usedAt);
    if (
      !window.confirm(
        accepted
          ? `O convite de ${invite.email} já foi aceito. Remover também a conta desta pessoa da ferramenta?`
          : `Cancelar o convite de ${invite.email}? O link enviado deixa de funcionar.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        const response = await fetch(`/api/ava/invites/id/${invite.id}`, {
          method: "DELETE",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao cancelar convite.");
          return;
        }
        setInvites((current) =>
          current.filter((item) => item.id !== invite.id),
        );
        if (data.removedUser?.id) {
          setUsers((current) =>
            current.filter((user) => user.id !== data.removedUser.id),
          );
        }
        if (inviteUrl) {
          setInviteUrl("");
          setInviteRole(null);
        }
        setMessage(
          data.removedUser
            ? `Acesso de ${data.removedUser.email} removido da ferramenta.`
            : `Convite de ${invite.email} cancelado.`,
        );
        router.refresh();
      } catch {
        setError("Falha de rede ao cancelar convite.");
      }
    });
  }

  function removeUser(user: UserRow) {
    if (
      !window.confirm(
        `Remover ${user.name} (${user.email}) da ferramenta? A pessoa perde o acesso imediatamente.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        const response = await fetch(`/api/ava/users/${user.id}`, {
          method: "DELETE",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao remover usuário.");
          return;
        }
        setUsers((current) => current.filter((item) => item.id !== user.id));
        setInvites((current) =>
          current.filter((invite) => invite.email !== user.email),
        );
        setMessage(`Acesso de ${user.email} removido da ferramenta.`);
        router.refresh();
      } catch {
        setError("Falha de rede ao remover usuário.");
      }
    });
  }

  function createSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        const response = await fetch("/api/ava/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.get("name") }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao criar matéria.");
          return;
        }
        if (data.subject) {
          setSubjects((current) => [...current, data.subject]);
        }
        setMessage("Matéria criada.");
        formEl.reset();
        router.refresh();
      } catch {
        setError("Falha de rede ao criar matéria. Tente novamente.");
      }
    });
  }

  function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const teacherId = String(form.get("teacherId") ?? "");
    const subjectId = String(form.get("subjectId") ?? selectedSubjectId);
    const name = String(form.get("name") ?? "");
    const shift = selectedShift || String(form.get("shift") ?? "");
    if (!subjectId || !shift) {
      setError("Selecione a matéria e o turno da turma.");
      return;
    }
    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        const response = await fetch("/api/ava/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subjectId,
            name,
            shift,
            teacherId: teacherId || null,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao criar turma.");
          return;
        }
        if (data.class) {
          const subject = subjects.find((item) => item.id === subjectId);
          const teacher = users.find((item) => item.id === teacherId);
          setClasses((current) => [
            ...current,
            {
              id: data.class.id,
              name: data.class.name,
              shift: data.class.shift ?? shift,
              subjectId: data.class.subjectId,
              subjectName: subject?.name ?? "Matéria",
              teacherId: data.class.teacherId,
              teacherName: teacher?.name ?? null,
            },
          ]);
          setMessage(
            `Turma criada${teacher ? ` com ${teacher.name}` : ""}. Abra Gerir aulas para publicar o conteúdo.`,
          );
        } else {
          setMessage("Turma criada.");
        }
        setSelectedSubjectId("");
        setSelectedShift("");
        formEl.reset();
        router.refresh();
      } catch {
        setError("Falha de rede ao criar turma. Tente novamente.");
      }
    });
  }

  function startEditClass(classRow: ClassRow) {
    setEditingClassId(classRow.id);
    setEditClassName(classRow.name);
    setEditClassShift(
      classRow.shift &&
        (shiftCodes as readonly string[]).includes(classRow.shift)
        ? (classRow.shift as ShiftCode)
        : "",
    );
    setEditClassTeacherId(classRow.teacherId ?? "");
    setMessage("");
    setError("");
  }

  function cancelEditClass() {
    setEditingClassId(null);
    setEditClassName("");
    setEditClassShift("");
    setEditClassTeacherId("");
  }

  function saveClassEdit(classRow: ClassRow) {
    const name = editClassName.trim();
    if (name.length < 2) {
      setError("Informe um nome válido para a turma.");
      return;
    }
    if (!editClassShift) {
      setError("Selecione o turno da turma.");
      return;
    }
    const allowed = allowedShiftsForSubject(classRow.subjectName);
    if (!allowed.includes(editClassShift)) {
      setError("Turno inválido para esta matéria.");
      return;
    }

    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        const response = await fetch(`/api/ava/classes/${classRow.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            shift: editClassShift,
            teacherId: editClassTeacherId || null,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao atualizar turma.");
          return;
        }

        const teacher =
          users.find((item) => item.id === (data.class?.teacherId ?? null)) ??
          null;
        setClasses((current) =>
          current.map((item) =>
            item.id === classRow.id
              ? {
                  ...item,
                  name: data.class?.name ?? name,
                  shift: data.class?.shift ?? editClassShift,
                  teacherId: data.class?.teacherId ?? null,
                  teacherName:
                    data.class?.teacherName ?? teacher?.name ?? null,
                }
              : item,
          ),
        );
        cancelEditClass();
        const assignedName =
          data.class?.teacherName ?? teacher?.name ?? null;
        setMessage(
          assignedName
            ? `Turma atualizada. Ela passa a aparecer no painel de ${assignedName}.`
            : "Turma atualizada sem professor atribuído.",
        );
        router.refresh();
      } catch {
        setError("Falha de rede ao atualizar turma.");
      }
    });
  }

  function deleteClass(classRow: ClassRow) {
    if (
      !window.confirm(
        `Remover a turma "${classRow.subjectName} — ${classRow.name}"? Aulas, matrículas e progresso dessa turma serão apagados.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        const response = await fetch(`/api/ava/classes/${classRow.id}`, {
          method: "DELETE",
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao remover turma.");
          return;
        }
        setClasses((current) =>
          current.filter((item) => item.id !== classRow.id),
        );
        if (editingClassId === classRow.id) cancelEditClass();
        setMessage(
          `Turma "${classRow.subjectName} — ${classRow.name}" removida.`,
        );
        router.refresh();
      } catch {
        setError("Falha de rede ao remover turma.");
      }
    });
  }

  function enrollStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        const response = await fetch("/api/ava/enrollments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: form.get("classId"),
            studentId: form.get("studentId"),
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao matricular aluno.");
          return;
        }
        setMessage("Aluno matriculado.");
        formEl.reset();
        router.refresh();
      } catch {
        setError("Falha de rede ao matricular. Tente novamente.");
      }
    });
  }

  const teachers = users.filter(
    (user) => user.role === "professor" || user.role === "admin",
  );
  const students = users.filter((user) => user.role === "aluno");
  const filteredUsers =
    userRoleFilter === "all"
      ? users
      : users.filter((user) => user.role === userRoleFilter);
  const filteredInvites =
    inviteRoleFilter === "all"
      ? invites
      : invites.filter((invite) => invite.role === inviteRoleFilter);

  return (
    <div className="space-y-10">
      {!emailConfigured ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Envio de convite por e-mail ainda limitado. No Resend, verifique o
          domínio <code className="font-mono text-xs">ametsaude.com.br</code> e
          no Vercel use{" "}
          <code className="font-mono text-xs">
            RESEND_FROM_EMAIL=AMET Saúde &amp; Estética
            &lt;noreply@ametsaude.com.br&gt;
          </code>
          . Enquanto isso, copie o link do convite.
        </div>
      ) : null}

      {!storageConfigured ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Upload de vídeo ainda não está pronto. Configure no Vercel:{" "}
          <code className="font-mono text-xs">
            {missingStorageKeys.join(", ") || "R2_*"}
          </code>
          . Depois, no bucket R2, libere CORS (PUT/GET) para{" "}
          <code className="font-mono text-xs">https://ametsaude.com.br</code>.
        </div>
      ) : null}

      {message ? (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}
      {inviteUrl ? (
        <div className="space-y-3 rounded-md border border-amet-indigo/15 bg-white px-4 py-4">
          <p className="text-sm font-medium text-amet-indigo">
            Link do convite
            {inviteRole ? ` · ${roleLabel(inviteRole)}` : ""} (copie e envie —
            o e-mail pode falhar)
          </p>
          <code className="block break-all rounded-md bg-amet-indigo/5 px-3 py-2 text-xs text-amet-indigo">
            {inviteUrl}
          </code>
          <button
            type="button"
            onClick={() => void copyInviteUrl(inviteUrl)}
            className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white"
          >
            {copyState === "copied"
              ? "Link copiado"
              : copyState === "failed"
                ? "Copie manualmente"
                : "Copiar link"}
          </button>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          id="convidar"
          onSubmit={createInvite}
          className="ava-panel scroll-mt-24 space-y-5"
        >
          <div className="space-y-1">
            <p className="ava-kicker">Convites</p>
            <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
              Convidar usuário
            </h2>
            <p className="text-sm text-[var(--ava-muted)]">
              O sistema envia o link de ativação para o e-mail digitado. Se o
              envio falhar, o link também aparece aqui para copiar.
            </p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">E-mail</span>
            <input
              name="email"
              type="email"
              required
              placeholder="E-mail"
              className="ava-input"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">Papel</span>
            <select
              name="role"
              required
              className="ava-input"
              defaultValue="aluno"
            >
              <option value="aluno">Aluno</option>
              <option value="professor">Professor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="ava-btn ava-btn-primary"
          >
            Criar convite
          </button>
        </form>

        <form
          id="materia"
          onSubmit={createSubject}
          className="ava-panel scroll-mt-24 space-y-3"
        >
          <div className="space-y-1">
            <p className="ava-kicker">Matérias</p>
            <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
              Matérias oficiais
            </h2>
            <p className="text-sm text-[var(--ava-muted)]">
              Estética, Imagem, Hematologia e Análises Clínicas já estão
              disponíveis. Só use este formulário se precisar de uma matéria
              extra.
            </p>
          </div>
          <ul className="space-y-1 text-sm text-amet-indigo">
            {subjects.map((subject) => (
              <li
                key={subject.id}
                className="border-t border-[var(--ava-line)] py-2 first:border-t-0"
              >
                {subject.name}
              </li>
            ))}
          </ul>
          <input
            name="name"
            required
            placeholder="Matéria extra (opcional)"
            className="ava-input"
          />
          <button
            type="submit"
            disabled={pending}
            className="ava-btn ava-btn-ghost"
          >
            Adicionar matéria
          </button>
        </form>

        <form
          id="turma"
          onSubmit={createClass}
          className="ava-panel scroll-mt-24 space-y-5"
        >
          <div className="space-y-1">
            <p className="ava-kicker">Turmas</p>
            <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
              Nova turma
            </h2>
            <p className="text-sm text-[var(--ava-muted)]">
              Matéria + turno. No sábado, qualquer curso é só 09h–13h.
            </p>
          </div>

          <div className="grid gap-2 text-xs text-[var(--ava-muted)] sm:grid-cols-3">
            {SHIFT_GUIDE.map((item) => (
              <div
                key={item.courses}
                className="border-t border-[var(--ava-line)] pt-2"
              >
                <p className="font-semibold text-amet-indigo/80">
                  {item.courses}
                </p>
                <p className="mt-1">{item.hours}</p>
              </div>
            ))}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">Matéria</span>
            <select
              name="subjectId"
              required
              className="ava-input"
              value={selectedSubjectId}
              onChange={(event) => {
                setSelectedSubjectId(event.target.value);
                setSelectedShift("");
              }}
            >
              <option value="" disabled>
                Selecione a matéria
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">Turno</span>
            <select
              name="shift"
              required
              className="ava-input"
              value={selectedShift}
              disabled={!selectedSubjectId}
              onChange={(event) =>
                setSelectedShift((event.target.value || "") as ShiftCode | "")
              }
            >
              <option value="" disabled>
                {selectedSubjectId
                  ? "Selecione o turno"
                  : "Selecione a matéria primeiro"}
              </option>
              {availableShifts.map((code) => {
                const info = SHIFTS[code];
                return (
                  <option key={code} value={code}>
                    {info.label} ({info.hours}
                    {code === "sabado" ? "" : ` · ${info.dayLabel}`})
                  </option>
                );
              })}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">
              Nome da turma
            </span>
            <input
              name="name"
              required
              placeholder="Ex.: Estética Facial — Manhã"
              className="ava-input"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">
              Professor
            </span>
            <select
              name="teacherId"
              className="ava-input"
              defaultValue=""
            >
              <option value="">Sem professor</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                  {teacher.role === "admin" ? " · admin" : ""}
                </option>
              ))}
            </select>
            {teachers.filter((teacher) => teacher.role === "professor")
              .length === 0 ? (
              <p className="text-xs text-amet-indigo/60">
                Nenhum professor com conta ativa. Convide em{" "}
                <a href="#convidar" className="font-medium text-amet-blue underline">
                  Convites
                </a>{" "}
                e peça para a pessoa abrir o link e ativar a conta — só então
                ela aparece aqui.
              </p>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={pending || !selectedSubjectId || !selectedShift}
            className="ava-btn ava-btn-primary"
          >
            {pending ? "Criando…" : "Criar turma"}
          </button>
        </form>

        <form
          id="matricular"
          onSubmit={enrollStudent}
          className="ava-panel scroll-mt-24 space-y-5"
        >
          <div className="space-y-1">
            <p className="ava-kicker">Matrículas</p>
            <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
              Matricular aluno
            </h2>
            <p className="text-sm text-[var(--ava-muted)]">
              Escolha a turma e o aluno com conta ativa.
            </p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">Turma</span>
            <select
              name="classId"
              required
              className="ava-input"
              defaultValue=""
            >
              <option value="" disabled>
                Selecione a turma
              </option>
              {classes.map((classRow) => (
                <option key={classRow.id} value={classRow.id}>
                  {classRow.subjectName} — {classRow.name}
                  {shiftLabel(classRow.shift)
                    ? ` · ${shiftLabel(classRow.shift)}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">Aluno</span>
            <select
              name="studentId"
              required
              className="ava-input"
              defaultValue=""
            >
              <option value="" disabled>
                Selecione o aluno
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={pending}
            className="ava-btn ava-btn-primary"
          >
            Matricular
          </button>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="ava-panel space-y-4">
          <div className="space-y-1">
            <p className="ava-kicker">Acesso</p>
            <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
              Usuários
            </h2>
            <p className="text-sm text-[var(--ava-muted)]">
              Remova alguém para tirar o acesso à ferramenta.
            </p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">Papel</span>
            <select
              className="ava-input"
              value={userRoleFilter}
              onChange={(event) =>
                setUserRoleFilter(
                  (event.target.value || "all") as UserRole | "all",
                )
              }
            >
              <option value="all">Todos os papéis</option>
              <option value="admin">Administrador</option>
              <option value="professor">Professor</option>
              <option value="aluno">Aluno</option>
            </select>
          </label>
          <ul className="space-y-2 text-sm">
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-amet-indigo/5 pb-2"
              >
                <span>
                  {user.name}
                  <span className="block text-amet-indigo/55">{user.email}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2 text-amet-indigo/70">
                  {roleLabel(user.role)}
                  {user.id !== currentUserId ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeUser(user)}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Remover
                    </button>
                  ) : (
                    <span className="text-xs text-amet-indigo/45">Você</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ava-panel space-y-4">
          <div className="space-y-1">
            <p className="ava-kicker">Convites</p>
            <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
              Convites enviados
            </h2>
            <p className="text-sm text-[var(--ava-muted)]">
              Pendente: cancela o link. Usado: remove também a conta criada.
            </p>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-amet-indigo">Papel</span>
            <select
              className="ava-input"
              value={inviteRoleFilter}
              onChange={(event) =>
                setInviteRoleFilter(
                  (event.target.value || "all") as UserRole | "all",
                )
              }
            >
              <option value="all">Todos os papéis</option>
              <option value="admin">Administrador</option>
              <option value="professor">Professor</option>
              <option value="aluno">Aluno</option>
            </select>
          </label>
          <ul className="space-y-2 text-sm">
            {filteredInvites.map((invite) => {
              const hasAccount = activeEmails.has(invite.email.toLowerCase());
              const statusLabel = !invite.usedAt
                ? "Pendente"
                : hasAccount
                  ? "Usado"
                  : "Conta removida";
              return (
                <li
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-amet-indigo/5 pb-2"
                >
                  <span>
                    {invite.email}
                    <span className="block text-amet-indigo/55">
                      {roleLabel(invite.role)}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-amet-indigo/70">
                    {statusLabel}
                    {!invite.usedAt || !hasAccount ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => regenerateInvite(invite)}
                        className="rounded-md border border-amet-indigo/20 px-2 py-1 text-xs font-medium text-amet-indigo hover:bg-amet-indigo/5 disabled:opacity-60"
                      >
                        Gerar novo link
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => cancelInvite(invite)}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {invite.usedAt && hasAccount
                        ? "Remover acesso"
                        : "Cancelar"}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section id="turmas" className="ava-panel scroll-mt-24 space-y-4">
        <div className="space-y-1">
          <p className="ava-kicker">Turmas</p>
          <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
            Turmas ativas
          </h2>
          <p className="text-sm text-[var(--ava-muted)]">
            Edite nome, turno e professor nos dropdowns. Ao atribuir um
            professor, a turma aparece automaticamente no painel dele.
          </p>
        </div>
        {classes.length === 0 ? (
          <p className="text-sm text-amet-indigo/60">
            Nenhuma turma ainda. Crie matéria e turma no fluxo acima.
          </p>
        ) : null}
        <ul className="space-y-3 text-sm">
          {classes.map((classRow) => {
            const editing = editingClassId === classRow.id;
            const editShifts = allowedShiftsForSubject(classRow.subjectName);
            return (
              <li
                key={classRow.id}
                className="rounded-md border border-amet-indigo/10 bg-amet-paper/40 px-3 py-3"
              >
                {editing ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amet-indigo/55">
                      Editando · {classRow.subjectName}
                    </p>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-amet-indigo">
                        Nome da turma
                      </span>
                      <input
                        value={editClassName}
                        onChange={(event) =>
                          setEditClassName(event.target.value)
                        }
                        required
                        minLength={2}
                        maxLength={120}
                        className="ava-input"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-amet-indigo">
                        Turno
                      </span>
                      <select
                        className="ava-input"
                        value={editClassShift}
                        onChange={(event) =>
                          setEditClassShift(
                            (event.target.value || "") as ShiftCode | "",
                          )
                        }
                      >
                        <option value="" disabled>
                          Selecione o turno
                        </option>
                        {editShifts.map((shift) => {
                          const info = SHIFTS[shift];
                          return (
                            <option key={shift} value={shift}>
                              {info.label} ({info.hours}
                              {shift === "sabado" ? "" : ` · ${info.dayLabel}`})
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-amet-indigo">
                        Professor
                      </span>
                      <select
                        value={editClassTeacherId}
                        onChange={(event) =>
                          setEditClassTeacherId(event.target.value)
                        }
                        className="ava-input"
                      >
                        <option value="">Sem professor</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.email})
                            {teacher.role === "admin" ? " · admin" : ""}
                          </option>
                        ))}
                      </select>
                      {teachers.filter((teacher) => teacher.role === "professor")
                        .length === 0 ? (
                        <p className="text-xs text-amet-indigo/60">
                          Nenhum professor ativo ainda. Convide e peça para
                          ativar a conta — ou atribua um admin temporariamente.
                        </p>
                      ) : null}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => saveClassEdit(classRow)}
                        className="rounded-md bg-amet-indigo px-3 py-1.5 text-sm font-semibold text-white hover:bg-amet-blue disabled:opacity-60"
                      >
                        {pending ? "Salvando…" : "Salvar turma"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={cancelEditClass}
                        className="rounded-md border border-amet-indigo/15 px-3 py-1.5 text-sm font-medium text-amet-indigo hover:bg-white disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>
                      {classRow.subjectName} — {classRow.name}
                      <span className="block text-amet-indigo/55">
                        {shiftLabel(classRow.shift) ?? "Sem turno"}
                        {" · "}
                        {classRow.teacherName
                          ? `Prof. ${classRow.teacherName}`
                          : "Sem professor"}
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => startEditClass(classRow)}
                        className="rounded-md border border-amet-indigo/15 px-3 py-1.5 text-sm font-medium text-amet-indigo hover:bg-white disabled:opacity-60"
                      >
                        Editar turma
                      </button>
                      <Link
                        href={classManagePath(classRow.id)}
                        className="rounded-md bg-amet-indigo px-3 py-1.5 text-sm font-semibold text-white hover:bg-amet-blue"
                      >
                        Editar aulas
                      </Link>
                      <Link
                        href={`/ava/turmas/${classRow.id}`}
                        className="rounded-md border border-amet-indigo/15 px-3 py-1.5 text-sm font-medium text-amet-indigo hover:bg-white"
                      >
                        Ver turma
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => deleteClass(classRow)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
