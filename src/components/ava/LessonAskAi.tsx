"use client";

import { useState, useTransition } from "react";

type LessonAskAiProps = {
  lessonId: string;
};

export function LessonAskAi({ lessonId }: LessonAskAiProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [provider, setProvider] = useState<string>("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/ava/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, question }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possível obter resposta.");
        return;
      }
      setAnswer(String(data.answer ?? ""));
      setProvider(String(data.provider ?? ""));
    });
  }

  return (
    <section className="ava-panel space-y-4">
      <div className="space-y-2">
        <p className="ava-kicker">Assistente</p>
        <h2 className="text-xl font-semibold tracking-tight text-amet-indigo">
          Pergunte sobre esta aula
        </h2>
        <p className="text-sm text-[var(--ava-muted)]">
          Apoio rápido. Se a IA estiver offline, você recebe um guia passo a
          passo.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          required
          minLength={3}
          maxLength={1000}
          rows={3}
          placeholder="Ex.: Pode explicar o ponto principal desta aula?"
          className="ava-input"
        />
        <button
          type="submit"
          disabled={pending}
          className="ava-btn ava-btn-ghost"
        >
          {pending ? "Pensando…" : "Perguntar ao assistente"}
        </button>
      </form>

      {error ? (
        <p className="border-l-2 border-red-700/60 bg-red-50/80 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {answer ? (
        <div className="space-y-2 border-l-2 border-amet-indigo/20 pl-4 text-sm leading-relaxed text-amet-indigo/90 whitespace-pre-wrap">
          {provider ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ava-muted)]">
              {provider === "openai" ? "Assistente IA" : "Guia assistido"}
            </p>
          ) : null}
          <p>{answer}</p>
        </div>
      ) : null}
    </section>
  );
}
