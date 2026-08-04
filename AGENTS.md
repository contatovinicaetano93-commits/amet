# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Next.js 16 (App Router) + React 19 + TypeScript** app (package `amet`)
for "AMET Saúde & Estética" — a pt-BR landing page with a multi-step internship
application form, public vacancy API, and a password-protected admin page. Package
manager is **pnpm**. There is no monorepo (the `pnpm-workspace.yaml` only holds
`allowBuilds` settings), no database, and no automated test suite.

### Running / building / linting
Commands are defined in `package.json`:
- Dev server: `pnpm dev` → http://localhost:3000 (Turbopack).
- Build: `pnpm build`; production start: `pnpm start` (requires a prior build).
- Lint: `pnpm lint` (ESLint flat config in `eslint.config.mjs`).
- No test runner is configured. Type-check manually with `pnpm exec tsc --noEmit` if needed.

### Non-obvious caveats
- `pnpm lint` currently reports **pre-existing** `react-hooks/set-state-in-effect`
  errors in `src/components/ApplicationForm.tsx` and `src/app/admin/page.tsx`. These
  are existing code issues, not an environment problem; a clean `pnpm lint` exit code
  is not expected on the current tree.
- `pnpm-workspace.yaml` contains placeholder `allowBuilds` values, so pnpm ignores the
  `sharp` and `unrs-resolver` build scripts during install. This is harmless — install,
  build, and dev all work without them.
- **No database.** Submissions persist to `data/candidaturas.json` (gitignored, auto-created
  by `src/lib/db.ts`). The `data/` dir must stay writable.
- Vacancy counts (`GET /api/vagas`) only decrement for `tipoPerfil: "aluno"` submissions;
  `nao_aluno` applications are stored but never reduce available vacancies (by design).
- Admin API: `GET /api/candidaturas` requires header `x-admin-key`. The key comes from
  env var `ADMIN_KEY`, defaulting to `amet-admin` when unset. No other secrets/services
  are required.

### Key endpoints for quick verification
- `GET /` — landing page
- `GET /admin` — admin dashboard (login uses the `ADMIN_KEY` value)
- `GET /api/vagas` — vacancy counts per area
- `POST /api/candidaturas` — submit an application (Zod-validated)
- `GET /api/candidaturas` — list applications (needs `x-admin-key`)
