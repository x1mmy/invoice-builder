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

-- Cash jobs (paid in cash, not invoiced)
create table if not exists public.cash_jobs (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  description text not null default '',
  breakdown text not null default '',
  hours numeric(8, 2) not null default 0,
  rate numeric(12, 2) not null default 0,
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists cash_jobs_date_idx on public.cash_jobs (date desc);

-- Extra columns if cash_jobs already existed without them
alter table public.cash_jobs add column if not exists breakdown text not null default '';
alter table public.cash_jobs add column if not exists hours numeric(8, 2) not null default 0;
alter table public.cash_jobs add column if not exists rate numeric(12, 2) not null default 0;

-- RLS on (defense in depth). App uses the secret key (bypasses RLS).
alter table public.invoices enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_jobs enable row level security;

-- No policies for anon/authenticated — browser clients cannot read/write.
-- All access goes through Next.js server actions with the secret key.

comment on table public.invoices is 'Saved invoices; amount is income as soon as saved; Paid is manual status';
comment on table public.expenses is 'Simple expense rows: date, description, amount';
comment on table public.cash_jobs is 'Cash jobs not invoiced: date, job details, breakdown, hours, rate, amount';
