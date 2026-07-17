"use client";

import { useState, useTransition } from "react";

type LessonPlayerProps = {
  lessonId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  initialCompleted: boolean;
  canMarkProgress: boolean;
};

export function LessonPlayer({
  lessonId,
  title,
  description,
  videoUrl,
  initialCompleted,
  canMarkProgress,
}: LessonPlayerProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleCompleted() {
    startTransition(async () => {
      setError("");
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-amet-indigo">{title}</h1>
        {description ? (
          <p className="max-w-3xl text-amet-indigo/70">{description}</p>
        ) : null}
      </div>

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

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
