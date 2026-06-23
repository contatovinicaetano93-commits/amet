# AMET Saúde & Estética

Site institucional da AMET — cursos, estágios, pós-graduação e candidaturas online.

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Zod

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Build

```bash
pnpm build
pnpm start
```

## API

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/vagas` | GET | Vagas disponíveis por área |
| `/api/candidaturas` | POST | Enviar candidatura de estágio |

Candidaturas são salvas em `data/candidaturas.json` (criado automaticamente em dev). Esse arquivo não vai para o Git.

## Clone

```bash
git clone https://github.com/contatovinicaetano93-commits/amet.git
cd amet
pnpm install
pnpm dev
```
