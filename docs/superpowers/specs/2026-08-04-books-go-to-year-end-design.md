# Books as go-to year-end page — Design Spec

**Date:** 2026-08-04  
**Status:** Approved (brainstorm)  
**Product:** Radiant Rooms Co — Books ledger polish for Australian FY and accountant sit-down  
**Supersedes in part:** [2026-07-30-books-ledger-design.md](./2026-07-30-books-ledger-design.md) (extends Books; does not replace invoice builder)

## Problem

Mum wants Books to be the ongoing go-to page for the business: clear income and expense totals she can understand like a spreadsheet, and a view she can sit through with an accountant at financial year end. Today Books already tracks income, expenses, and profit, but “Year” is calendar Jan–Dec (not AU FY), income is a single figure (no Received/Paid breakdown), expenses cannot be edited, and the summary is three equal cards without a clear FY-first story.

## Solution

Polish the existing Books home (`/`) — keep the name **Books** and product language that avoids “dashboard / spreadsheet / accounting”. Add Australian financial year as a first-class period, default Books to the current FY, show **Invoiced** and **Received** beside Expenses and a hero **Profit**, densify the Invoices and Expenses sheets with period totals, and allow editing expenses. No file export in this pass — handoff is on-screen.

## Product decisions

| Decision | Choice |
|----------|--------|
| Surface | Evolve Books (`/`), not a new page |
| Approach | Polish Books (not year-end-only panel, not full Excel grid rebuild) |
| Summary layout | **Hero Profit** — large Profit for the period; Invoiced, Received, Expenses as supporting figures |
| Periods | `month` · `fy` · `year` (calendar) · `all` |
| Default period | Current Australian FY (`fy`) |
| FY definition | 1 July – 30 June; label e.g. `FY 2025–26`; ← → to previous/next FY |
| Invoiced | Sum of all saved invoice amounts in period (unchanged income definition) |
| Received | Sum of invoices with status `Paid` in period |
| Expenses | Sum of expense amounts in period |
| Profit | Invoiced − Expenses (Paid does **not** change Profit) |
| Still to receive | Subtle line when Received < Invoiced (difference) under the summary |
| Sheets | Keep Invoices \| Expenses tabs; denser columns + footer totals |
| Expenses fields | Date, description, amount only; add **edit** (plus existing add/delete) |
| Accountant handoff | On-screen FY walkthrough only (no CSV/PDF pack this pass) |
| Visual | Keep Cormorant + DM Sans / stone / sage; refine hierarchy, do not restyle the whole app |

## Out of scope

- CSV or PDF accountant export pack
- Expense categories, receipts, suppliers
- GST / BAS fields or tax reports
- Unified chronological cashbook with running balance
- Changing Profit to cash basis (Paid-only income)
- Schema migration (Paid already exists on invoices)
- Bank sync, email invoices, multi-user accounts

## UI

### Summary (Hero Profit)

1. Period chips: This month · This FY · Calendar year · All  
2. When period is `fy`: show `FY YYYY–YY` with previous/next controls  
3. Hero block: **Profit** + period label  
4. Three supporting figures: **Invoiced** · **Received** · **Expenses**  
5. Optional cue: “$X still to receive” when applicable  

### Invoices sheet

Columns: Date · Client · Status · Amount, plus existing open / mark paid / delete actions.  
Footer: Total invoiced for period.

### Expenses sheet

Columns: Date · Description · Amount.  
Footer: Total expenses for period.  
Actions: Add, Edit (inline or small form), Delete.

### Mobile (first-class)

Every Books surface must work on a phone-width viewport (~320–430px) without horizontal scroll:

- Stack order: title → period chips (wrap) → FY ← → (when applicable) → hero Profit → supporting figures (1-col stack, then 3-col from `sm`) → still-to-receive → tabs → sheet
- Period chips and actions: min ~44px tap height; chips wrap rather than overflow
- Sheet rows stack on narrow screens; amounts and actions remain reachable without sideways scroll
- Expense add + edit forms stack to a single column on mobile
- No fixed widths that force overflow; prefer `min-w-0`, wrapping, and `tabular-nums`

## Data & periods

Extend `PeriodFilter` to `"month" | "fy" | "year" | "all"`.

- **month** — current calendar month (unchanged)  
- **fy** — Australian FY containing `now` (or navigated FY via offset); bounds 1 Jul → 30 Jun  
- **year** — calendar 1 Jan → 31 Dec (unchanged)  
- **all** — no date bounds (unchanged)  

Filter invoices by `invoice_date`; expenses by `date` (unchanged).

Extend totals type conceptually:

```ts
type BooksTotals = {
  income: number;      // Invoiced — keep field name in code for minimal churn
  received: number;    // Paid sum — new
  expenses: number;
  profit: number;      // income - expenses
};
```

URL search params drive period: `?period=fy` (default when omitted or invalid). FY navigation uses `fyStart=YYYY` where `YYYY` is the calendar year the FY begins (e.g. `fyStart=2025` → 2025-07-01 through 2026-06-30, labelled `FY 2025–26`). Omit `fyStart` to mean the FY containing today. Other periods ignore `fyStart`.

## Architecture

```
/login  →  session cookie
Books (/)  ←→  server actions  ←→  Supabase (invoices, expenses)
  period: month | fy | year | all
  totals: invoiced, received, expenses, profit
Invoice builder unchanged
```

Primary touchpoints:

| Area | Files |
|------|--------|
| Period helpers | `src/lib/period.ts` |
| Totals types | `src/lib/books.ts` |
| Load Books | `src/app/page.tsx` (+ invoice load path if totals computed there) |
| UI | `src/components/BooksLedger.tsx` |
| Expense edit | `src/app/actions/expenses.ts` + expense form UI in Books |
| Language | `CONTEXT.md` |

No new tables or columns.

## Error handling

- Load/save failures → existing friendly toasts  
- Failed expense edit leaves the previous row intact  
- Invalid `period` / FY param → fall back to current FY  

## Testing (implementation plan will detail)

- AU FY bounds around 30 Jun / 1 Jul boundaries  
- Totals: Invoiced vs Received vs Profit formula  
- Expense update action  
- Default route lands on `fy`  

## Language (CONTEXT.md)

- Keep **Books**, **Income** framing via **Invoiced** / **Received** labels in UI  
- Avoid: dashboard, spreadsheet, accounting, BAS  
- Document FY period and that Profit still uses Invoiced (saved amounts), not Received  

## Success criteria

1. Opening Books defaults to the current Australian FY with labelled Profit.  
2. Mum can see Invoiced, Received, Expenses, and Profit for month / FY / calendar year / all.  
3. She can flip FYs and sit with an accountant on screen without exporting a file.  
4. She can edit an expense without deleting and re-adding.  
5. Existing invoice save → income behaviour and Paid toggle remain intact.
