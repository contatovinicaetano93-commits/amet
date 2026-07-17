import * as Sentry from "@sentry/nextjs";

type AvaLogLevel = "info" | "warn" | "error";

type AvaLogFields = Record<string, string | number | boolean | null | undefined>;

function emit(level: AvaLogLevel, event: string, fields: AvaLogFields = {}) {
  const payload = {
    ts: new Date().toISOString(),
    service: "ava",
    level,
    event,
    ...fields,
  };

  const line = JSON.stringify(payload);
  switch (level) {
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      Sentry.captureMessage(event, {
        level: "error",
        extra: fields,
        tags: { service: "ava" },
      });
      break;
    default: {
      const _exhaustive: never = level;
      console.log(String(_exhaustive));
    }
  }
}

export const avaLog = {
  info: (event: string, fields?: AvaLogFields) => emit("info", event, fields),
  warn: (event: string, fields?: AvaLogFields) => emit("warn", event, fields),
  error: (event: string, fields?: AvaLogFields) => emit("error", event, fields),
};

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function captureAvaException(
  error: unknown,
  context?: AvaLogFields & { event?: string },
) {
  const event = context?.event ?? "ava.exception";
  avaLog.error(event, {
    ...context,
    message: errorMessage(error),
  });
  Sentry.captureException(error, {
    tags: { service: "ava", event },
    extra: context,
  });
}
