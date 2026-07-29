# 0003. Supabase books ledger + password gate

## Status

Accepted (supersedes 0001)

## Context

v1 was client-only with no database (ADR 0001). Mum now needs invoice history, expense tracking, and profit across devices. A shared password is enough — no multi-user signup.

## Decision

- Store invoices and expenses in Supabase Postgres
- All DB access via Next.js server actions using the secret key (never expose secret to the browser)
- Gate the app with a shared password and a signed httpOnly session cookie
- Keep client-side PDF generation (ADR 0002 unchanged)
- Keep localStorage drafts as backup until a save succeeds

## Consequences

- Requires env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_PASSWORD`, `AUTH_SECRET`
- Schema applied manually in Supabase SQL Editor (`supabase/schema.sql`)
- ADR 0001 is superseded; PDF remains the client deliverable, Books is the operational record
