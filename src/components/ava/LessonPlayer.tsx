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
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-amet-indigo">{title}</h1>

      <div className="overflow-hidden rounded-lg border border-amet-indigo/10 bg-black shadow-[0_24px_60px_-40px_rgba(28,36,147,0.65)]">
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
          <div className="flex aspect-video items-center justify-center bg-amet-indigo/90 px-6 text-center text-white">
            Vídeo ainda não disponível para esta aula.
          </div>
        )}
      </div>

      {canEditBio ? (
        <section className="space-y-3 rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-amet-indigo">
                Bio da aula
              </h2>
              <p className="text-sm text-amet-indigo/65">
                Informações que os alunos veem junto ao vídeo.
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
                className="rounded-md border border-amet-indigo/15 px-3 py-1.5 text-sm font-medium text-amet-indigo hover:bg-amet-indigo/5"
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
                placeholder="Ex.: objetivos da aula, materiais, avisos e o que revisar antes de assistir…"
                className="w-full rounded-md border border-amet-indigo/15 px-3 py-2 text-sm outline-none ring-amet-blue/30 focus:ring-2"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white hover:bg-amet-blue disabled:opacity-60"
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
                  className="rounded-md border border-amet-indigo/15 px-4 py-2 text-sm text-amet-indigo disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : bio ? (
            <p className="whitespace-pre-wrap text-sm text-amet-indigo/80">
              {bio}
            </p>
          ) : (
            <p className="text-sm text-amet-indigo/55">
              Nenhuma bio ainda. Adicione orientações, materiais ou avisos da
              aula.
            </p>
          )}
        </section>
      ) : bio ? (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-amet-purple">
            Sobre esta aula
          </h2>
          <p className="max-w-3xl whitespace-pre-wrap text-amet-indigo/75">
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
            className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white transition hover:bg-amet-blue disabled:opacity-60"
          >
            {completed ? "Desmarcar conclusão" : "Marcar como concluída"}
          </button>
          <span className="text-sm text-amet-indigo/65">
            Status: {completed ? "Concluída" : "Em andamento"}
          </span>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
