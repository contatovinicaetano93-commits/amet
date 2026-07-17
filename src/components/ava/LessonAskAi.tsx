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
    <section className="rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
      <div className="mb-3 space-y-1">
        <h2 className="text-lg font-semibold text-amet-indigo">
          Pergunte sobre esta aula
        </h2>
        <p className="text-sm text-amet-indigo/65">
          Tire dúvidas com o assistente do AVA. Se a IA estiver offline, você
          recebe um guia passo a passo.
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
          className="w-full rounded-md border border-amet-indigo/15 px-3 py-2 outline-none ring-amet-blue/30 focus:ring-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white transition hover:bg-amet-blue disabled:opacity-60"
        >
          {pending ? "Pensando…" : "Perguntar"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {answer ? (
        <div className="mt-4 space-y-2 rounded-md bg-amet-indigo/5 px-4 py-3 text-sm text-amet-indigo/90 whitespace-pre-wrap">
          {provider ? (
            <p className="text-xs uppercase tracking-[0.14em] text-amet-purple">
              {provider === "openai" ? "Assistente IA" : "Guia assistido"}
            </p>
          ) : null}
          <p>{answer}</p>
        </div>
      ) : null}
    </section>
  );
}
