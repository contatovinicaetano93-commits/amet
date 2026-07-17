import { NextResponse } from "next/server";

import { captureAvaException, avaLog, errorMessage } from "@/lib/ava/observability";

export function jsonOk<T extends Record<string, unknown>>(
  data: T,
  init?: { status?: number },
) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export function jsonError(
  error: string,
  init?: { status?: number; details?: unknown; event?: string },
) {
  if (init?.event) {
    avaLog.warn(init.event, { error, status: init.status ?? 400 });
  }
  return NextResponse.json(
    {
      error,
      ...(init?.details !== undefined ? { details: init.details } : {}),
    },
    { status: init?.status ?? 400 },
  );
}

export function jsonServerError(event: string, error: unknown) {
  captureAvaException(error, { event, message: errorMessage(error) });
  return NextResponse.json(
    { error: "Falha interna. Tente novamente em instantes." },
    { status: 500 },
  );
}
