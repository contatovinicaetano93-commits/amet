"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { FlowTree } from "@/components/ava/FlowTree";
import { buildClassManageFlow } from "@/lib/ava/flows";
import { homePathForRole } from "@/lib/ava/navigation";
import type { UserRole } from "@/lib/ava/schema";
import { shiftDetail } from "@/lib/ava/shifts";

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
  shift: string | null;
  viewerRole: UserRole;
  initialLessons: LessonRow[];
  initialStudents: StudentRow[];
  initialProgress: ProgressStudent[];
};

export function ClassManagePanel({
  classId,
  className,
  subjectName,
  shift,
  viewerRole,
  initialLessons,
  initialStudents,
  initialProgress,
}: ClassManagePanelProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState(initialLessons);
  const [students] = useState(initialStudents);
  const [progress] = useState(initialProgress);

  useEffect(() => {
    setLessons(initialLessons);
  }, [initialLessons]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(
    null,
  );
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const manageFlow = buildClassManageFlow({
    lessonsCount: lessons.length,
    withVideoCount: lessons.filter((lesson) => lesson.hasVideo).length,
    publishedCount: lessons.filter((lesson) => lesson.published).length,
  });

  function refresh() {
    router.refresh();
  }

  function startEdit(lesson: LessonRow) {
    setEditingLessonId(lesson.id);
    setEditTitle(lesson.title);
    setEditDescription(lesson.description ?? "");
    setError("");
    setMessage("");
  }

  function cancelEdit() {
    setEditingLessonId(null);
    setEditTitle("");
    setEditDescription("");
  }

  function createLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const videoFile = form.get("video");
    const file = videoFile instanceof File && videoFile.size > 0 ? videoFile : null;

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

      formEl.reset();
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

      if (data.lesson && file) {
        const uploaded = await uploadVideo(data.lesson.id, file);
        if (!uploaded) {
          setMessage(
            "Aula criada, mas o vídeo não subiu. Tente novamente no cartão da aula.",
          );
        }
      } else {
        setMessage(
          "Aula criada. Selecione o vídeo no cartão da aula abaixo para enviar.",
        );
      }
      refresh();
    });
  }

  async function uploadVideo(lessonId: string, file: File): Promise<boolean> {
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
        return false;
      }

      const putRes = await fetch(intent.uploadUrl, {
        method: "PUT",
        headers: intent.headers,
        body: file,
      });

      if (!putRes.ok) {
        setError(
          "Falha ao enviar o arquivo para o storage. Confira o CORS do bucket R2.",
        );
        return false;
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
        return false;
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
      return true;
    } finally {
      setUploadingLessonId(null);
    }
  }

  async function togglePublish(lessonId: string, published: boolean) {
    startTransition(async () => {
      setError("");
      setMessage("");
      const response = await fetch(`/api/ava/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Falha ao atualizar publicação.");
        return;
      }
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                published: Boolean(data.lesson?.published ?? !published),
                hasVideo:
                  data.lesson?.hasVideo === undefined
                    ? lesson.hasVideo
                    : Boolean(data.lesson.hasVideo),
              }
            : lesson,
        ),
      );
      setMessage(
        data.lesson?.published ? "Aula publicada." : "Aula despublicada.",
      );
      refresh();
    });
  }

  function saveLessonEdit(lessonId: string) {
    const title = editTitle.trim();
    if (title.length < 2) {
      setError("O título precisa ter ao menos 2 caracteres.");
      return;
    }
    startTransition(async () => {
      setError("");
      setMessage("");
      const response = await fetch(`/api/ava/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: editDescription.trim() || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar a aula.");
        return;
      }
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === lessonId
            ? {
                ...lesson,
                title: data.lesson?.title ?? title,
                description:
                  data.lesson?.description === undefined
                    ? editDescription.trim() || null
                    : data.lesson.description,
              }
            : lesson,
        ),
      );
      cancelEdit();
      setMessage("Aula atualizada.");
      refresh();
    });
  }

  function deleteLesson(lessonId: string, title: string) {
    if (
      !window.confirm(
        `Excluir a aula “${title}”? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      setError("");
      setMessage("");
      const response = await fetch(`/api/ava/lessons/${lessonId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possível excluir a aula.");
        return;
      }
      setLessons((current) =>
        current.filter((lesson) => lesson.id !== lessonId),
      );
      if (editingLessonId === lessonId) cancelEdit();
      setMessage("Aula excluída.");
      refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="ava-kicker">
          {viewerRole === "admin" ? "Gestão da turma" : "Área do professor"} ·{" "}
          {subjectName}
        </p>
        <h1 className="ava-display text-4xl text-amet-indigo">{className}</h1>
        {shiftDetail(shift) ? (
          <p className="text-sm text-[var(--ava-muted)]">{shiftDetail(shift)}</p>
        ) : null}
        <p className="max-w-2xl text-sm text-[var(--ava-muted)]">
          Nesta turma você tem gestão total das aulas: criar, editar, trocar
          vídeo, publicar, despublicar e excluir.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={homePathForRole(viewerRole)}
            className="text-sm text-amet-blue hover:underline"
          >
            ← Voltar ao painel
          </Link>
          <Link
            href={`/ava/turmas/${classId}`}
            className="text-sm text-amet-blue hover:underline"
          >
            Ver como aluno
          </Link>
        </div>
      </div>

      <FlowTree tree={manageFlow} compact />

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
        id="nova-aula"
        onSubmit={createLesson}
        className="scroll-mt-24 space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5"
      >
        <h2 className="text-lg font-semibold">Nova vídeo-aula</h2>
        <p className="text-sm text-amet-indigo/65">
          Preencha o título, escolha o vídeo (mp4/webm) e clique em criar. O
          upload começa em seguida.
        </p>
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
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-amet-indigo">
            Vídeo da aula (mp4 ou webm)
          </span>
          <input
            name="video"
            type="file"
            accept="video/mp4,video/webm"
            className="block w-full text-sm text-amet-indigo/80 file:mr-3 file:rounded-md file:border-0 file:bg-amet-indigo file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </label>
        <button
          type="submit"
          disabled={pending || Boolean(uploadingLessonId)}
          className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {uploadingLessonId
            ? "Enviando vídeo…"
            : pending
              ? "Criando…"
              : "Criar aula e enviar vídeo"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Aulas</h2>
        {lessons.length === 0 ? (
          <div className="rounded-md border border-dashed border-amet-indigo/15 bg-white/70 px-4 py-6 text-amet-indigo/70">
            <p>Nenhuma aula nesta turma ainda.</p>
            <p className="mt-2 text-sm">
              Crie abaixo ou confira se a aula publicada está em outra turma do
              seu painel (cada turma tem suas próprias aulas).
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="rounded-lg border border-amet-indigo/10 bg-white/90 p-4"
              >
                {editingLessonId === lesson.id ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amet-indigo/55">
                      Editando aula {lesson.order + 1}
                    </p>
                    <input
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      required
                      minLength={2}
                      maxLength={160}
                      className="ava-input"
                      placeholder="Título da aula"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(event) =>
                        setEditDescription(event.target.value)
                      }
                      rows={3}
                      maxLength={2000}
                      className="ava-input"
                      placeholder="Bio / descrição da aula"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => saveLessonEdit(lesson.id)}
                        className="ava-btn ava-btn-primary"
                      >
                        {pending ? "Salvando…" : "Salvar alterações"}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={cancelEdit}
                        className="ava-btn ava-btn-ghost"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                          disabled={pending}
                          onClick={() => startEdit(lesson)}
                          className="rounded-md border border-amet-indigo/15 px-3 py-1.5 text-sm"
                        >
                          Editar
                        </button>
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
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            deleteLesson(lesson.id, lesson.title)
                          }
                          className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    <label className="mt-4 block space-y-1.5 text-sm">
                      <span className="font-medium text-amet-indigo">
                        {uploadingLessonId === lesson.id
                          ? "Enviando vídeo…"
                          : lesson.hasVideo
                            ? "Trocar vídeo (mp4/webm)"
                            : "Enviar vídeo (mp4/webm)"}
                      </span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        disabled={uploadingLessonId === lesson.id || pending}
                        className="block w-full text-sm text-amet-indigo/80 file:mr-3 file:rounded-md file:border-0 file:bg-amet-indigo file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                        onChange={(event) => {
                          const selected = event.target.files?.[0];
                          if (selected) void uploadVideo(lesson.id, selected);
                        }}
                      />
                    </label>
                  </>
                )}
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
