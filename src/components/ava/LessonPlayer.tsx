"use client";

import { useState, useTransition } from "react";

type LessonPlayerProps = {
  lessonId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  initialCompleted: boolean;
  canMarkProgress: boolean;
  canEditBio?: boolean;
};

export function LessonPlayer({
  lessonId,
  title,
  description,
  videoUrl,
  initialCompleted,
  canMarkProgress,
  canEditBio = false,
}: LessonPlayerProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [bio, setBio] = useState(description ?? "");
  const [draftBio, setDraftBio] = useState(description ?? "");
  const [editingBio, setEditingBio] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleCompleted() {
    startTransition(async () => {
      setError("");
      setMessage("");
      const next = !completed;
      const response = await fetch("/api/ava/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possível atualizar o progresso.");
        return;
      }
      setCompleted(Boolean(data.completed));
    });
  }

  function saveBio(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      setError("");
      setMessage("");
      const next = draftBio.trim();
      const response = await fetch(`/api/ava/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: next.length > 0 ? next : null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar a bio da aula.");
        return;
      }
      const saved = data.lesson?.description ?? null;
      setBio(saved ?? "");
      setDraftBio(saved ?? "");
      setEditingBio(false);
      setMessage("Bio da aula atualizada.");
    });
  }

  return (
    <div className="space-y-8">
      <div className="ava-fade-in space-y-3">
        <p className="ava-kicker">Vídeo-aula</p>
        <h1 className="ava-display text-3xl text-amet-indigo sm:text-4xl">
          {title}
        </h1>
      </div>

      <div className="ava-fade-in-delay ava-cinema">
        {videoUrl ? (
          <video
            key={videoUrl}
            controls
            playsInline
            className="aspect-video w-full bg-black"
            src={videoUrl}
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
        ) : (
          <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-white/75">
            Vídeo ainda não disponível para esta aula.
          </div>
        )}
      </div>

      {canEditBio ? (
        <section className="ava-fade-in-delay-2 ava-panel space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="ava-kicker">Bio da aula</p>
              <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
                Informações do vídeo
              </h2>
              <p className="text-sm text-[var(--ava-muted)]">
                Orientação que os alunos leem junto à aula.
              </p>
            </div>
            {!editingBio ? (
              <button
                type="button"
                onClick={() => {
                  setDraftBio(bio);
                  setEditingBio(true);
                  setMessage("");
                  setError("");
                }}
                className="ava-btn ava-btn-ghost"
              >
                {bio ? "Editar bio" : "Adicionar bio"}
              </button>
            ) : null}
          </div>

          {editingBio ? (
            <form onSubmit={saveBio} className="space-y-3">
              <textarea
                value={draftBio}
                onChange={(event) => setDraftBio(event.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="Objetivos, materiais, avisos e o que revisar antes de assistir…"
                className="ava-input"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="ava-btn ava-btn-primary"
                >
                  {pending ? "Salvando…" : "Salvar bio"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setDraftBio(bio);
                    setEditingBio(false);
                    setError("");
                  }}
                  className="ava-btn ava-btn-ghost"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : bio ? (
            <p className="max-w-3xl whitespace-pre-wrap leading-relaxed text-amet-indigo/85">
              {bio}
            </p>
          ) : (
            <p className="text-sm text-[var(--ava-muted)]">
              Nenhuma bio ainda. Adicione orientações, materiais ou avisos.
            </p>
          )}
        </section>
      ) : bio ? (
        <section className="ava-fade-in-delay-2 ava-panel space-y-2">
          <p className="ava-kicker">Sobre esta aula</p>
          <p className="max-w-3xl whitespace-pre-wrap text-lg leading-relaxed text-amet-indigo/85">
            {bio}
          </p>
        </section>
      ) : null}

      {canMarkProgress ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={toggleCompleted}
            className="ava-btn ava-btn-primary"
          >
            {completed ? "Desmarcar conclusão" : "Marcar como concluída"}
          </button>
          <span className="text-sm text-[var(--ava-muted)]">
            {completed ? "Concluída" : "Em andamento"}
          </span>
        </div>
      ) : null}

      {message ? (
        <p className="border-l-2 border-emerald-700/60 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="border-l-2 border-red-700/60 bg-red-50/80 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}
