"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { classManagePath } from "@/lib/ava/navigation";
import { roleLabel } from "@/lib/ava/permissions";
import type { UserRole } from "@/lib/ava/schema";
import {
  SHIFT_GUIDE,
  SHIFTS,
  allowedShiftsForSubject,
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
  initialUsers: UserRow[];
  initialInvites: InviteRow[];
  initialSubjects: SubjectRow[];
  initialClasses: ClassRow[];
  storageConfigured: boolean;
  missingStorageKeys: string[];
  emailConfigured: boolean;
};

export function AdminPanel({
  initialUsers,
  initialInvites,
  initialSubjects,
  initialClasses,
  storageConfigured,
  missingStorageKeys,
  emailConfigured,
}: AdminPanelProps) {
  const router = useRouter();
  const [users] = useState(initialUsers);
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
  const [pending, startTransition] = useTransition();

  const selectedSubjectName =
    subjects.find((item) => item.id === selectedSubjectId)?.name ?? "";
  const availableShifts = useMemo(
    () =>
      selectedSubjectName
        ? allowedShiftsForSubject(selectedSubjectName)
        : ([] as ShiftCode[]),
    [selectedSubjectName],
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

  function createSubject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      setMessage("");
      setError("");
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
      event.currentTarget.reset();
      router.refresh();
    });
  }

  function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const teacherId = String(form.get("teacherId") ?? "");
    const subjectId = String(form.get("subjectId") ?? "");
    const name = String(form.get("name") ?? "");
    const shift = String(form.get("shift") ?? "");
    startTransition(async () => {
      setMessage("");
      setError("");
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
      }
      setMessage("Turma criada.");
      setSelectedSubjectId("");
      setSelectedShift("");
      event.currentTarget.reset();
      router.refresh();
    });
  }

  function enrollStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      setMessage("");
      setError("");
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
      event.currentTarget.reset();
      router.refresh();
    });
  }

  const teachers = users.filter(
    (user) => user.role === "professor" || user.role === "admin",
  );
  const students = users.filter((user) => user.role === "aluno");

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
          className="scroll-mt-24 space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
        >
          <h2 className="text-lg font-semibold">Convidar usuário</h2>
          <p className="text-sm text-amet-indigo/65">
            O sistema envia o link de ativação para o e-mail digitado. Se o
            envio falhar, o link também aparece aqui para copiar.
          </p>
          <input
            name="email"
            type="email"
            required
            placeholder="E-mail"
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
          />
          <select
            name="role"
            required
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
            defaultValue="aluno"
          >
            <option value="aluno">Aluno</option>
            <option value="professor">Professor</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Criar convite
          </button>
        </form>

        <form
          id="materia"
          onSubmit={createSubject}
          className="scroll-mt-24 space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
        >
          <h2 className="text-lg font-semibold">Nova matéria</h2>
          <input
            name="name"
            required
            placeholder="Nome da matéria"
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Criar matéria
          </button>
        </form>

        <form
          id="turma"
          onSubmit={createClass}
          className="scroll-mt-24 space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
        >
          <h2 className="text-lg font-semibold">Nova turma</h2>
          <p className="text-sm text-amet-indigo/65">
            Escolha matéria e turno. Sábado é sempre 09h–13h.
          </p>
          <ul className="space-y-1 text-xs text-amet-indigo/60">
            {SHIFT_GUIDE.map((item) => (
              <li key={item.courses}>
                <span className="font-medium text-amet-indigo/75">
                  {item.courses}
                </span>
                {": "}
                {item.hours}
              </li>
            ))}
          </ul>
          <select
            name="subjectId"
            required
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
            value={selectedSubjectId}
            onChange={(event) => {
              setSelectedSubjectId(event.target.value);
              setSelectedShift("");
            }}
          >
            <option value="" disabled>
              Matéria
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select
            name="shift"
            required
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
            value={selectedShift}
            onChange={(event) =>
              setSelectedShift(event.target.value as ShiftCode | "")
            }
            disabled={!selectedSubjectId}
          >
            <option value="" disabled>
              Turno
            </option>
            {availableShifts.map((code) => (
              <option key={code} value={code}>
                {SHIFTS[code].label} · {SHIFTS[code].hours}
                {code === "sabado" ? "" : ` (${SHIFTS[code].dayLabel})`}
              </option>
            ))}
          </select>
          <input
            name="name"
            required
            placeholder="Nome da turma"
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
          />
          <select
            name="teacherId"
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
            defaultValue=""
          >
            <option value="">Sem professor</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Criar turma
          </button>
        </form>

        <form
          id="matricular"
          onSubmit={enrollStudent}
          className="scroll-mt-24 space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
        >
          <h2 className="text-lg font-semibold">Matricular aluno</h2>
          <select
            name="classId"
            required
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>
              Turma
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
          <select
            name="studentId"
            required
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>
              Aluno
            </option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.email})
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Matricular
          </button>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
          <h2 className="mb-3 text-lg font-semibold">Usuários</h2>
          <ul className="space-y-2 text-sm">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between gap-3 border-b border-amet-indigo/5 pb-2"
              >
                <span>
                  {user.name}
                  <span className="block text-amet-indigo/55">{user.email}</span>
                </span>
                <span className="text-amet-indigo/70">{roleLabel(user.role)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
          <h2 className="mb-3 text-lg font-semibold">Convites</h2>
          <ul className="space-y-2 text-sm">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-3 border-b border-amet-indigo/5 pb-2"
              >
                <span>
                  {invite.email}
                  <span className="block text-amet-indigo/55">
                    {roleLabel(invite.role)}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-amet-indigo/70">
                  {invite.usedAt ? "Usado" : "Pendente"}
                  {!invite.usedAt ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => regenerateInvite(invite)}
                      className="rounded-md border border-amet-indigo/20 px-2 py-1 text-xs font-medium text-amet-indigo hover:bg-amet-indigo/5 disabled:opacity-60"
                    >
                      Gerar novo link
                    </button>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="turmas"
        className="scroll-mt-24 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
      >
        <h2 className="mb-3 text-lg font-semibold">Turmas</h2>
        {classes.length === 0 ? (
          <p className="text-sm text-amet-indigo/60">
            Nenhuma turma ainda. Crie matéria e turma no fluxo acima.
          </p>
        ) : null}
        <ul className="space-y-2 text-sm">
          {classes.map((classRow) => (
            <li
              key={classRow.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-amet-indigo/5 pb-2"
            >
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
              <Link
                href={classManagePath(classRow.id)}
                className="font-medium text-amet-blue hover:underline"
              >
                Gerir aulas
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
