"use client";

import { useState, useTransition } from "react";

type QuestionRow = {
  id: string;
  body: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
  askerName: string;
  isMine: boolean;
  answeredByName: string | null;
};

type LessonQuestionsProps = {
  lessonId: string;
  canAsk: boolean;
  canAnswer: boolean;
  initialQuestions: QuestionRow[];
};

export function LessonQuestions({
  lessonId,
  canAsk,
  canAnswer,
  initialQuestions,
}: LessonQuestionsProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/ava/lessons/${lessonId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possível enviar a pergunta.");
        return;
      }
      if (data.question) {
        setQuestions((current) => [data.question, ...current]);
      }
      setBody("");
      setMessage("Pergunta enviada ao professor.");
    });
  }

  function submitAnswer(questionId: string) {
    const answer = (answerDrafts[questionId] ?? "").trim();
    if (!answer) {
      setError("Escreva a resposta antes de enviar.");
      return;
    }
    setError("");
    setMessage("");
    startTransition(async () => {
      const response = await fetch(
        `/api/ava/lessons/${lessonId}/questions/${questionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "Não foi possível responder.");
        return;
      }
      if (data.question) {
        setQuestions((current) =>
          current.map((item) =>
            item.id === questionId ? data.question : item,
          ),
        );
        setAnswerDrafts((current) => ({ ...current, [questionId]: "" }));
        setMessage("Resposta publicada.");
      }
    });
  }

  const openCount = questions.filter((item) => !item.answer).length;

  return (
    <section className="space-y-4 rounded-lg border border-amet-indigo/10 bg-white/90 p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-amet-indigo">
          Dúvidas com o professor
        </h2>
        <p className="text-sm text-amet-indigo/65">
          {canAsk
            ? "Envie sua dúvida. Só alunos perguntam; o professor responde aqui."
            : canAnswer
              ? "Responda as dúvidas dos alunos desta aula."
              : "Dúvidas dos alunos e respostas do professor desta aula."}
          {openCount > 0 ? ` · ${openCount} em aberto` : null}
        </p>
      </div>

      {canAsk ? (
        <form onSubmit={submitQuestion} className="space-y-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            minLength={3}
            maxLength={2000}
            rows={3}
            placeholder="Ex.: No minuto 4:20, como faço esse corte?"
            className="w-full rounded-md border border-amet-indigo/15 px-3 py-2 outline-none ring-amet-blue/30 focus:ring-2"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-amet-indigo px-4 py-2 text-sm font-semibold text-white transition hover:bg-amet-blue disabled:opacity-60"
          >
            {pending ? "Enviando…" : "Enviar pergunta"}
          </button>
        </form>
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

      <ul className="space-y-3">
        {questions.length === 0 ? (
          <li className="rounded-md border border-dashed border-amet-indigo/15 px-4 py-6 text-sm text-amet-indigo/65">
            Nenhuma pergunta ainda nesta aula.
          </li>
        ) : (
          questions.map((question) => (
            <li
              key={question.id}
              className="rounded-md border border-amet-indigo/10 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amet-indigo/55">
                <span>
                  {question.isMine ? "Você" : question.askerName}
                  {" · "}
                  {new Date(question.createdAt).toLocaleString("pt-BR")}
                </span>
                <span
                  className={
                    question.answer
                      ? "font-medium text-emerald-700"
                      : "font-medium text-amber-700"
                  }
                >
                  {question.answer ? "Respondida" : "Aguardando professor"}
                </span>
              </div>
              <p className="mt-2 text-sm text-amet-indigo">{question.body}</p>

              {question.answer ? (
                <div className="mt-3 rounded-md bg-amet-indigo/5 px-3 py-2 text-sm text-amet-indigo/90">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-amet-purple">
                    Resposta
                    {question.answeredByName
                      ? ` · ${question.answeredByName}`
                      : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{question.answer}</p>
                </div>
              ) : canAnswer ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={answerDrafts[question.id] ?? ""}
                    onChange={(event) =>
                      setAnswerDrafts((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Escreva a resposta para o aluno…"
                    className="w-full rounded-md border border-amet-indigo/15 px-3 py-2 text-sm outline-none ring-amet-blue/30 focus:ring-2"
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => submitAnswer(question.id)}
                    className="rounded-md bg-amet-indigo px-3 py-1.5 text-sm font-semibold text-white hover:bg-amet-blue disabled:opacity-60"
                  >
                    Publicar resposta
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-amet-indigo/55">
                  O professor ainda não respondeu.
                </p>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
