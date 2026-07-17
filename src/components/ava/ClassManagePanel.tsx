"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  hasVideo: boolean;
  published: boolean;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
};

type ProgressStudent = StudentRow & {
  completedLessonIds: string[];
};

type ClassManagePanelProps = {
  classId: string;
  className: string;
  subjectName: string;
  initialLessons: LessonRow[];
  initialStudents: StudentRow[];
  initialProgress: ProgressStudent[];
};

export function ClassManagePanel({
  classId,
  className,
  subjectName,
  initialLessons,
  initialStudents,
  initialProgress,
}: ClassManagePanelProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [students] = useState(initialStudents);
  const [progress] = useState(initialProgress);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(
    null,
  );

  function refresh() {
    router.refresh();
  }

  function createLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      setMessage("");
      setError("");
      const response = await fetch("/api/ava/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          title: form.get("title"),
          description: form.get("description") || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Falha ao criar aula.");
        return;
      }
      setMessage("Aula criada. Envie o vídeo abaixo.");
      event.currentTarget.reset();
      if (data.lesson) {
        setLessons((current) => [
          ...current,
          {
            id: data.lesson.id,
            title: data.lesson.title,
            description: data.lesson.description,
            order: data.lesson.order,
            hasVideo: false,
            published: false,
          },
        ]);
      }
      refresh();
    });
  }

  async function uploadVideo(lessonId: string, file: File) {
    setUploadingLessonId(lessonId);
    setError("");
    setMessage("");
    try {
      const intentRes = await fetch(`/api/ava/lessons/${lessonId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          contentLength: file.size,
          fileName: file.name,
        }),
      });
      const intent = await intentRes.json().catch(() => ({}));
      if (!intentRes.ok) {
        setError(intent.error ?? "Falha ao preparar upload.");
        return;
      }

      const putRes = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: intent.headers,
        body: file,
      });

      if (!putRes.ok) {
        setError("Falha ao enviar o arquivo para o storage.");
        return;
      }

      const confirmRes = await fetch(
        `/api/ava/lessons/${lessonId}/confirm-upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: true }),
        },
      );
      const confirm = await confirmRes.json().catch(() => ({}));
      if (!confirmRes.ok) {
        setError(confirm.error ?? "Upload enviado, mas confirmação falhou.");
        return;
      }

      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? { ...lesson, hasVideo: true, published: true }
            : lesson,
        ),
      );
      setMessage("Vídeo enviado e aula publicada.");
      refresh();
    } finally {
      setUploadingLessonId(null);
    }
  }

  async function togglePublish(lessonId: string, published: boolean) {
    startTransition(async () => {
      const response = await fetch(`/api/ava/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Falha ao atualizar publicação.");
        return;
      }
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? { ...lesson, published: !published }
            : lesson,
        ),
      );
      refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amet-purple">
          {subjectName}
        </p>
        <h1 className="text-3xl font-semibold text-amet-indigo">{className}</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/ava" className="text-sm text-amet-blue hover:underline">
            ← Voltar ao AVA
          </Link>
          <Link
            href="/ava/admin"
            className="text-sm text-amet-blue hover:underline"
          >
            Painel admin
          </Link>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || message}
        </div>
      )}

      <form
        onSubmit={createLesson}
        className="space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
      >
        <h2 className="text-lg font-semibold">Nova vídeo-aula</h2>
        <input
          name="title"
          required
          placeholder="Título da aula"
          className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
        />
        <textarea
          name="description"
          placeholder="Descrição (opcional)"
          rows={3}
          className="w-full rounded-md border border-amet-indigo/15 px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Criar aula
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Aulas</h2>
        {lessons.length === 0 ? (
          <p className="text-amet-indigo/60">Nenhuma aula ainda.</p>
        ) : (
          <ul className="space-y-3">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="rounded-lg border border-amet-indigo/10 bg-white/90 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-amet-indigo">
                      {lesson.order + 1}. {lesson.title}
                    </h3>
                    {lesson.description ? (
                      <p className="mt-1 text-sm text-amet-indigo/65">
                        {lesson.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-amet-indigo/55">
                      {lesson.hasVideo ? "Vídeo enviado" : "Sem vídeo"} ·{" "}
                      {lesson.published ? "Publicada" : "Rascunho"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/ava/turmas/${classId}/aulas/${lesson.id}`}
                      className="rounded-md border border-amet-indigo/15 px-3 py-1.5 text-sm"
                    >
                      Abrir
                    </Link>
                    <button
                      type="button"
                      disabled={!lesson.hasVideo || pending}
                      onClick={() =>
                        void togglePublish(lesson.id, lesson.published)
                      }
                      className="rounded-md border border-amet-indigo/15 px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      {lesson.published ? "Despublicar" : "Publicar"}
                    </button>
                  </div>
                </div>

                <label className="mt-4 block text-sm">
                  <span className="mb-1 block font-medium">
                    {uploadingLessonId === lesson.id
                      ? "Enviando vídeo…"
                      : "Upload de vídeo (mp4/webm)"}
                  </span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    disabled={uploadingLessonId === lesson.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadVideo(lesson.id, file);
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
          <h2 className="mb-3 text-lg font-semibold">Alunos matriculados</h2>
          <ul className="space-y-2 text-sm">
            {students.map((student) => (
              <li key={student.id}>
                {student.name}
                <span className="block text-amet-indigo/55">{student.email}</span>
              </li>
            ))}
            {students.length === 0 ? (
              <li className="text-amet-indigo/60">Nenhum aluno ainda.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
          <h2 className="mb-3 text-lg font-semibold">Progresso</h2>
          <ul className="space-y-2 text-sm">
            {progress.map((student) => (
              <li key={student.id}>
                {student.name}
                <span className="block text-amet-indigo/55">
                  {student.completedLessonIds.length}/{lessons.length} aulas
                  concluídas
                </span>
              </li>
            ))}
            {progress.length === 0 ? (
              <li className="text-amet-indigo/60">Sem progresso registrado.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}
