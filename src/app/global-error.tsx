"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf7f2] px-6 text-[#1c2493]">
        <h1 className="text-2xl font-semibold">Algo deu errado</h1>
        <p className="max-w-md text-center text-sm opacity-70">
          Registramos o erro automaticamente. Tente novamente em instantes.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-[#1c2493] px-4 py-2 text-sm font-semibold text-white"
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
