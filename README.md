# Radiant Rooms Co — Books & Invoice Builder

Password-gated Next.js app for **Radiant Rooms Co**: create invoices (PDF download), save them to a Supabase-backed **Books** ledger, log expenses, and see profit.

## Setup

1. **Supabase schema** — open the Supabase SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql).

2. **Env** — copy [`.env.example`](.env.example) to `.env.local` and fill in:

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_SECRET_KEY` | Project Settings → API → secret key |
| `APP_PASSWORD` | Shared login password |
| `AUTH_SECRET` | Random string (`openssl rand -hex 32`) |

3. Run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → login → Books.

## Features

- **Books** — Income / Expenses / Profit; period filter (month / year / all); Invoices & Expenses tabs
- **New invoice** — form + live preview + Download PDF + **Save to Books**
- Income counts as soon as an invoice is saved; **Paid** is toggled manually
- Expenses: date, description, amount
- Drafts still soft-save in `localStorage` until saved to Books

## Deploy (Vercel)

Set the same env vars in the Vercel project, then deploy.

## Notes

- Domain language: [`CONTEXT.md`](CONTEXT.md)
- Design: [`docs/superpowers/specs/2026-07-30-books-ledger-design.md`](docs/superpowers/specs/2026-07-30-books-ledger-design.md)
- ADRs: [`docs/adr/`](docs/adr/)
