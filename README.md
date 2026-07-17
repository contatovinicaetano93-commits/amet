# AMET — site + AVA

Site institucional da AMET Saúde & Estética e MVP do Ambiente Virtual de Aprendizagem (`/ava`).

## Getting Started

```bash
cp env.example .env.local
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## AVA (MVP)

Rotas principais:

- `/ava/login` — login
- `/ava/convite/[token]` — ativação por convite
- `/ava` — turmas do usuário
- `/ava/admin` — painel admin (convites, matérias, turmas, matrículas)
- `/ava/admin/turmas/[id]` — aulas, upload de vídeo e progresso

### Setup do banco e storage

1. Crie um banco Neon e preencha `DATABASE_URL`
2. Gere `AUTH_SECRET` (`openssl rand -base64 32`)
3. Defina `AVA_BOOTSTRAP_ADMIN_EMAIL` e `AVA_BOOTSTRAP_ADMIN_PASSWORD` para o primeiro admin
4. Configure Cloudflare R2 (`R2_*`) para upload de vídeo-aulas + CORS (PUT/GET no domínio do site)
5. (Recomendado) Upstash Redis: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
6. (Recomendado) Sentry: `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`
7. Aplique o schema:

```bash
npm run db:push
# ou
npm run db:migrate
```

Health: `GET /api/ava/health` (use `?deep=1` para probe do R2).

Fluxo: admin convida → usuário define senha → admin cria matéria/turma/matrícula → professor/admin sobe vídeo → aluno assiste e marca concluído.
