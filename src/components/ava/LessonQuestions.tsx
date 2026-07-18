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
    <section className="ava-panel space-y-6">
      <div className="space-y-2">
        <p className="ava-kicker">Diálogo</p>
        <h2 className="text-2xl font-semibold tracking-tight text-amet-indigo">
          Dúvidas com o professor
        </h2>
        <p className="max-w-2xl text-sm text-[var(--ava-muted)]">
          {canAsk
            ? "Envie sua dúvida. Só alunos perguntam; o professor responde aqui."
            : canAnswer
              ? "Responda as dúvidas dos alunos desta aula."
              : "Perguntas dos alunos e respostas do professor."}
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
            className="ava-input"
          />
          <button
            type="submit"
            disabled={pending}
            className="ava-btn ava-btn-primary"
          >
            {pending ? "Enviando…" : "Enviar pergunta"}
          </button>
        </form>
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

      <ul>
        {questions.length === 0 ? (
          <li className="border-t border-[var(--ava-line)] py-6 text-sm text-[var(--ava-muted)]">
            Nenhuma pergunta ainda nesta aula.
          </li>
        ) : (
          questions.map((question) => (
            <li
              key={question.id}
              className="space-y-3 border-t border-[var(--ava-line)] py-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.12em] text-[var(--ava-muted)]">
                <span>
                  {question.isMine ? "Você" : question.askerName}
                  {" · "}
                  {new Date(question.createdAt).toLocaleString("pt-BR")}
                </span>
                <span
                  className={
                    question.answer
                      ? "font-semibold text-emerald-800"
                      : "font-semibold text-amet-indigo/70"
                  }
                >
                  {question.answer ? "Respondida" : "Aguardando"}
                </span>
              </div>
              <p className="text-[1.02rem] leading-relaxed text-amet-indigo">
                {question.body}
              </p>

              {question.answer ? (
                <div className="space-y-1 border-l-2 border-amet-indigo/25 pl-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ava-muted)]">
                    Resposta
                    {question.answeredByName
                      ? ` · ${question.answeredByName}`
                      : ""}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed text-amet-indigo/90">
                    {question.answer}
                  </p>
                </div>
              ) : canAnswer ? (
                <div className="space-y-2 pt-1">
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
                    className="ava-input"
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => submitAnswer(question.id)}
                    className="ava-btn ava-btn-primary"
                  >
                    Publicar resposta
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[var(--ava-muted)]">
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
