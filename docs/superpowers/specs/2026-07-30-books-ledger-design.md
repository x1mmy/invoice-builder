# Books ledger + Supabase — Design Spec

**Date:** 2026-07-30  
**Status:** Approved  
**Product:** Radiant Rooms Co invoicing → books ledger

## Problem

Mum needs invoices and a simple income/expense/profit spreadsheet in one place. Today the app is a client-only invoice PDF builder with no history or books.

## Solution

Extend the Next.js app with a password-gated **Books** ledger backed by Supabase. Saving an invoice writes it to the ledger as income; mum adds expenses as simple rows; profit = income − expenses.

## Product decisions

| Decision | Choice |
|----------|--------|
| Home | Books: summary (Income / Expenses / Profit) + tabs (Invoices \| Expenses) |
| Period filter | Month / Year / All |
| Income timing | Amount counts as soon as invoice is saved |
| Paid | Manual status toggle (does not gate income) |
| Expenses | Date, description, amount only |
| Auth | Shared app password → httpOnly session cookie |
| DB access | Server-only (Next.js server actions + Supabase secret) |
| Mobile | First-class; large tap targets |
| Visual | Keep Cormorant + DM Sans / stone / sage aesthetic |

## Out of scope (v1)

Categories, GST/tax reports, multi-user accounts, bank sync, emailing invoices, storing PDF blobs in Supabase.

## Architecture

```
/login  →  session cookie  →  middleware
Books (/)  ←→  server actions  ←→  Supabase (invoices, expenses)
Invoice builder  →  Save to books + Download PDF (unchanged client PDF)
```

## Data model

### `invoices`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | default gen_random_uuid() |
| invoice_number | text | |
| invoice_date | date | period filter |
| job_date | date | |
| client_name | text | |
| amount | numeric | AUD subtotal from line items |
| status | text | Draft \| Due on receipt \| Paid \| Overdue |
| payload | jsonb | full Invoice for re-edit / PDF regen |
| created_at | timestamptz | default now() |

### `expenses`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid PK | |
| date | date | period filter |
| description | text | |
| amount | numeric | AUD |
| created_at | timestamptz | |

**Profit** (for selected period) = `sum(invoices.amount)` − `sum(expenses.amount)`.

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Password gate |
| `/` | Books ledger |
| `/invoice/new` | New invoice builder |
| `/invoice/[id]` | Edit saved invoice, toggle Paid, re-download PDF |

Nav: **Books** | **New invoice**.

## Auth

1. Login compares password to `APP_PASSWORD`
2. Sets signed httpOnly cookie (`AUTH_SECRET`)
3. Middleware protects app routes; `/login` public
4. Logout clears cookie

## Env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (server only)
- `APP_PASSWORD` (server only)
- `AUTH_SECRET` (server only)

Publishable key optional for v1 (server-only DB). Schema applied via SQL in Supabase SQL Editor — see `supabase/schema.sql`.

## Error handling

- Wrong password → inline message
- Save/load failures → friendly toast
- Keep localStorage draft until save succeeds

## Testing

Manual: login, save invoice → Books + income, toggle Paid, add/delete expense → profit, mobile widths.
