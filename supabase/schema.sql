-- Radiant Rooms Co — Books ledger schema
-- Paste into Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: uses IF NOT EXISTS

create extension if not exists "pgcrypto";

-- Invoices (income rows; amount counts as soon as saved)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  invoice_date date not null,
  job_date date not null default current_date,
  client_name text not null default '',
  amount numeric(12, 2) not null default 0,
  status text not null default 'Due on receipt'
    check (status in ('Draft', 'Due on receipt', 'Paid', 'Overdue')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists invoices_invoice_date_idx on public.invoices (invoice_date desc);
create index if not exists invoices_created_at_idx on public.invoices (created_at desc);

-- Expenses (simple rows)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  description text not null default '',
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses (date desc);

-- RLS on (defense in depth). App uses the secret key (bypasses RLS).
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;

-- No policies for anon/authenticated — browser clients cannot read/write.
-- All access goes through Next.js server actions with the secret key.

comment on table public.invoices is 'Saved invoices; amount is income as soon as saved; Paid is manual status';
comment on table public.expenses is 'Simple expense rows: date, description, amount';
