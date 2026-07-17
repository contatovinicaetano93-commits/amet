"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { roleLabel } from "@/lib/ava/permissions";
import type { UserRole } from "@/lib/ava/schema";

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
};

export function AdminPanel({
  initialUsers,
  initialInvites,
  initialSubjects,
  initialClasses,
  storageConfigured,
  missingStorageKeys,
}: AdminPanelProps) {
  const router = useRouter();
  const [users] = useState(initialUsers);
  const [invites, setInvites] = useState(initialInvites);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [classes, setClasses] = useState(initialClasses);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    startTransition(async () => {
      setMessage("");
      setError("");
      try {
        const response = await fetch("/api/ava/invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.get("email"),
            role: form.get("role"),
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error ?? "Falha ao criar convite.");
          return;
        }

        const parts = [
          data.emailSent
            ? "Convite criado e e-mail enviado."
            : "Convite criado.",
          data.warning ? String(data.warning) : "",
          data.inviteUrl
            ? `Envie este link ao professor/aluno: ${data.inviteUrl}`
            : "",
        ].filter(Boolean);

        setMessage(parts.join(" "));
        if (data.warning) {
          setError(String(data.warning));
        }
        if (data.invite) {
          setInvites((current) => [
            {
              id: data.invite.id,
              email: data.invite.email,
              role: data.invite.role,
              expiresAt: data.invite.expiresAt,
              usedAt: null,
            },
            ...current,
          ]);
        }
        formEl.reset();
        router.refresh();
      } catch {
        setError("Falha de rede ao criar convite. Tente novamente.");
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
    startTransition(async () => {
      setMessage("");
      setError("");
      const response = await fetch("/api/ava/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          name,
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
            subjectId: data.class.subjectId,
            subjectName: subject?.name ?? "Matéria",
            teacherId: data.class.teacherId,
            teacherName: teacher?.name ?? null,
          },
        ]);
      }
      setMessage("Turma criada.");
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

      {(message || error) && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            error
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={createInvite}
          className="space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
        >
          <h2 className="text-lg font-semibold">Convidar usuário</h2>
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
            Enviar convite
          </button>
        </form>

        <form
          onSubmit={createSubject}
          className="space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
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
          onSubmit={createClass}
          className="space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
        >
          <h2 className="text-lg font-semibold">Nova turma</h2>
          <select
            name="subjectId"
            required
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
            defaultValue=""
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
          onSubmit={enrollStudent}
          className="space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
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
                <span className="text-amet-indigo/70">
                  {invite.usedAt ? "Usado" : "Pendente"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
        <h2 className="mb-3 text-lg font-semibold">Turmas</h2>
        <ul className="space-y-2 text-sm">
          {classes.map((classRow) => (
            <li
              key={classRow.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-amet-indigo/5 pb-2"
            >
              <span>
                {classRow.subjectName} — {classRow.name}
                <span className="block text-amet-indigo/55">
                  {classRow.teacherName
                    ? `Prof. ${classRow.teacherName}`
                    : "Sem professor"}
                </span>
              </span>
              <Link
                href={`/ava/admin/turmas/${classRow.id}`}
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
