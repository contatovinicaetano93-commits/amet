import { getAvaAiApiKey, getAvaAiModel, isAvaAiEnabled } from "@/lib/ava/ai/config";
import { avaLog, errorMessage } from "@/lib/ava/observability";

export type AvaAskContext = {
  lessonTitle: string;
  lessonDescription?: string | null;
  className?: string | null;
  subjectName?: string | null;
};

export type AvaAskResult =
  | { ok: true; answer: string; provider: "openai" | "guided" }
  | { ok: false; error: string };

function guidedFallback(question: string, context: AvaAskContext): string {
  return [
    "A IA ainda não está configurada neste ambiente, então aqui vai um guia rápido:",
    "",
    `Aula: ${context.lessonTitle}`,
    context.lessonDescription
      ? `Contexto: ${context.lessonDescription}`
      : "Sem descrição cadastrada — peça ao professor um resumo da aula.",
    "",
    `Sua pergunta: ${question}`,
    "",
    "Próximos passos sugeridos:",
    "1. Revise o vídeo e anote os minutos das partes que geraram dúvida.",
    "2. Reformule a pergunta com o trecho exato (ex.: “no minuto 04:20…”).",
    "3. Se continuar a dúvida, envie para o professor da turma.",
  ].join("\n");
}

export async function askAboutLesson(params: {
  question: string;
  context: AvaAskContext;
}): Promise<AvaAskResult> {
  const question = params.question.trim();
  if (question.length < 3) {
    return { ok: false, error: "Pergunta muito curta." };
  }
  if (question.length > 1000) {
    return { ok: false, error: "Pergunta muito longa (máx. 1000 caracteres)." };
  }

  if (!isAvaAiEnabled()) {
    return {
      ok: true,
      provider: "guided",
      answer: guidedFallback(question, params.context),
    };
  }

  const apiKey = getAvaAiApiKey();
  if (!apiKey) {
    return {
      ok: true,
      provider: "guided",
      answer: guidedFallback(question, params.context),
    };
  }

  try {
    const system = [
      "Você é o assistente educacional do AVA AMET.",
      "Responda em português do Brasil, de forma clara e objetiva.",
      "Use apenas o contexto da aula fornecido. Se não souber, diga o que falta.",
      "Não invente procedimentos clínicos sem base no material.",
    ].join(" ");

    const user = [
      `Matéria: ${params.context.subjectName ?? "—"}`,
      `Turma: ${params.context.className ?? "—"}`,
      `Aula: ${params.context.lessonTitle}`,
      `Descrição: ${params.context.lessonDescription ?? "—"}`,
      "",
      `Pergunta do aluno: ${question}`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getAvaAiModel(),
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      avaLog.error("ai.ask_failed", {
        status: response.status,
        body: text.slice(0, 200),
      });
      return {
        ok: true,
        provider: "guided",
        answer: guidedFallback(question, params.context),
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return {
        ok: true,
        provider: "guided",
        answer: guidedFallback(question, params.context),
      };
    }

    return { ok: true, provider: "openai", answer };
  } catch (error) {
    avaLog.error("ai.ask_exception", { message: errorMessage(error) });
    return {
      ok: true,
      provider: "guided",
      answer: guidedFallback(question, params.context),
    };
  }
}
