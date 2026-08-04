# Books Go-To Year-End Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish Books into Mum’s go-to page with Australian FY periods, Hero Profit summary (Invoiced / Received / Expenses), denser sheets with footers, and editable expenses — on-screen accountant handoff, no export.

**Architecture:** Extend pure period helpers and Books totals; thread `period` + `fyStart` through the Books page and list actions; redesign `BooksLedger` summary/nav; add `updateExpense` server action with inline edit UI. No schema migration.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, Supabase (server actions only), Vitest for new unit tests (none exist today).

**Spec:** [docs/superpowers/specs/2026-08-04-books-go-to-year-end-design.md](../specs/2026-08-04-books-go-to-year-end-design.md)

## Global Constraints

- Product name for home remains **Books** — avoid UI copy: dashboard, spreadsheet, accounting, BAS
- Profit = Invoiced − Expenses; Paid does **not** change Profit
- Australian FY = 1 July – 30 June; URL `?period=fy&fyStart=YYYY` (FY begins calendar year `YYYY`)
- Default Books period when params missing/invalid: **current FY**
- No CSV/PDF export, no expense categories, no GST
- Keep Cormorant + DM Sans / stone / sage aesthetic
- Server-only Supabase; auth via existing `requireAuth`
- **Mobile-first responsive:** Books UI must work at ~320px width with no horizontal scroll; stack hero → chips → FY nav → totals → tabs → sheets; ≥44px tap targets; forms single-column on narrow screens; sheet rows stack until `sm`

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/period.ts` | `PeriodFilter` incl. `fy`; FY bounds, label, start-year helpers; `periodRange` options |
| `src/lib/books.ts` | `BooksTotals` adds `received` |
| `src/lib/period.test.ts` | Unit tests for FY math + range |
| `src/app/actions/invoices.ts` | Pass FY options into `periodRange` |
| `src/app/actions/expenses.ts` | Same + `updateExpense` |
| `src/app/page.tsx` | Parse `period`/`fyStart`, default `fy`, compute `received` |
| `src/components/BooksLedger.tsx` | Hero Profit UI, period chips, FY ←→, sheet footers, expense edit |
| `CONTEXT.md` | Document FY / Invoiced / Received |
| `package.json` | Add `vitest` + `test` script |

---

### Task 1: Vitest + Australian FY period helpers

**Files:**
- Create: `src/lib/period.test.ts`
- Modify: `package.json`
- Modify: `src/lib/period.ts`
- Create: `vitest.config.ts` (minimal)

**Interfaces:**
- Consumes: none
- Produces:
  - `export type PeriodFilter = "month" | "fy" | "year" | "all"`
  - `export type PeriodRangeOptions = { now?: Date; fyStartYear?: number }`
  - `export function currentFyStartYear(now?: Date): number`
  - `export function fyLabel(fyStartYear: number): string` → `"FY 2025–26"` (en-dash)
  - `export function periodRange(period: PeriodFilter, options?: PeriodRangeOptions): { from: string | null; to: string | null }`
  - Existing `sumAmounts` / `profit` unchanged

- [ ] **Step 1: Add Vitest**

```bash
npm install -D vitest
```

Add to `package.json` scripts: `"test": "vitest run"`.

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 2: Write failing tests** in `src/lib/period.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  currentFyStartYear,
  fyLabel,
  periodRange,
} from "@/lib/period";

describe("currentFyStartYear", () => {
  it("returns same calendar year on or after 1 July", () => {
    expect(currentFyStartYear(new Date(2026, 6, 1))).toBe(2026); // Jul 1
    expect(currentFyStartYear(new Date(2026, 11, 31))).toBe(2026);
  });

  it("returns previous calendar year before 1 July", () => {
    expect(currentFyStartYear(new Date(2026, 5, 30))).toBe(2025); // Jun 30
    expect(currentFyStartYear(new Date(2026, 0, 1))).toBe(2025);
  });
});

describe("fyLabel", () => {
  it("formats FY with en-dash", () => {
    expect(fyLabel(2025)).toBe("FY 2025–26");
    expect(fyLabel(1999)).toBe("FY 1999–00");
  });
});

describe("periodRange fy", () => {
  it("uses current FY when fyStartYear omitted", () => {
    const range = periodRange("fy", { now: new Date(2026, 7, 4) }); // Aug 4 2026
    expect(range).toEqual({ from: "2026-07-01", to: "2027-06-30" });
  });

  it("honours explicit fyStartYear", () => {
    const range = periodRange("fy", {
      now: new Date(2026, 7, 4),
      fyStartYear: 2024,
    });
    expect(range).toEqual({ from: "2024-07-01", to: "2025-06-30" });
  });

  it("keeps month/year/all behaviour", () => {
    expect(periodRange("month", { now: new Date(2026, 7, 4) })).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(periodRange("year", { now: new Date(2026, 7, 4) })).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
    expect(periodRange("all")).toEqual({ from: null, to: null });
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
npm test
```

Expected: FAIL — `fy` / helpers missing or wrong signature.

- [ ] **Step 4: Implement `src/lib/period.ts`**

Replace contents with:

```ts
export type PeriodFilter = "month" | "fy" | "year" | "all";

export type PeriodRangeOptions = {
  now?: Date;
  fyStartYear?: number;
};

type DateRange = { from: string | null; to: string | null };

/** Calendar year in which the Australian FY begins (1 July). */
export function currentFyStartYear(now = new Date()): number {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed; July = 6
  return m >= 6 ? y : y - 1;
}

/** e.g. fyStartYear 2025 → "FY 2025–26" */
export function fyLabel(fyStartYear: number): string {
  const end = String((fyStartYear + 1) % 100).padStart(2, "0");
  return `FY ${fyStartYear}–${end}`;
}

/** Inclusive ISO date bounds (YYYY-MM-DD) for the selected period. */
export function periodRange(
  period: PeriodFilter,
  options: PeriodRangeOptions = {},
): DateRange {
  const now = options.now ?? new Date();

  if (period === "all") {
    return { from: null, to: null };
  }

  const y = now.getFullYear();
  const m = now.getMonth();

  if (period === "fy") {
    const start = options.fyStartYear ?? currentFyStartYear(now);
    return {
      from: `${start}-07-01`,
      to: `${start + 1}-06-30`,
    };
  }

  if (period === "year") {
    return {
      from: `${y}-01-01`,
      to: `${y}-12-31`,
    };
  }

  // month
  const lastDay = new Date(y, m + 1, 0).getDate();
  const mm = String(m + 1).padStart(2, "0");
  return {
    from: `${y}-${mm}-01`,
    to: `${y}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function sumAmounts(rows: { amount: number | string }[]): number {
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return Math.round(total * 100) / 100;
}

export function profit(income: number, expenses: number): number {
  return Math.round((income - expenses) * 100) / 100;
}
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
npm test
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/period.ts src/lib/period.test.ts
git commit -m "$(cat <<'EOF'
Add Australian FY period helpers and Vitest.

EOF
)"
```

---

### Task 2: Totals type + wire period/FY through page and list actions

**Files:**
- Modify: `src/lib/books.ts`
- Modify: `src/app/actions/invoices.ts` (`listInvoices`)
- Modify: `src/app/actions/expenses.ts` (`listExpenses`)
- Modify: `src/app/page.tsx`
- Create: `src/lib/books-totals.test.ts` (pure received sum helper — inline in page OR extract; prefer small helper in `period.ts` or `books.ts`)

**Interfaces:**
- Consumes: `periodRange`, `PeriodFilter`, `currentFyStartYear`, `sumAmounts`, `profit` from Task 1
- Produces:
  - `BooksTotals = { income: number; received: number; expenses: number; profit: number }`
  - `listInvoices(period, fyStartYear?: number)`
  - `listExpenses(period, fyStartYear?: number)`
  - Page parses `searchParams.period` + `searchParams.fyStart`; default period `"fy"`

- [ ] **Step 1: Extend `BooksTotals` in `src/lib/books.ts`**

```ts
export type BooksTotals = {
  income: number;
  received: number;
  expenses: number;
  profit: number;
};
```

Add helper (same file or `period.ts` — keep in `books.ts` for domain clarity):

```ts
export function sumReceived(
  invoices: { amount: number | string; status: string }[],
): number {
  return sumAmounts(
    invoices.filter((row) => row.status === "Paid"),
  );
}
```

(Import `sumAmounts` from `@/lib/period` in `books.ts`.)

- [ ] **Step 2: Failing test for `sumReceived`**

`src/lib/books-totals.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sumReceived } from "@/lib/books";

describe("sumReceived", () => {
  it("sums only Paid invoices", () => {
    expect(
      sumReceived([
        { amount: 100, status: "Paid" },
        { amount: 50, status: "Due on receipt" },
        { amount: 25.5, status: "Paid" },
      ]),
    ).toBe(125.5);
  });
});
```

Run `npm test` — FAIL until helper exists; then implement; PASS.

- [ ] **Step 3: Update list actions**

In both `listInvoices` and `listExpenses`:

```ts
export async function listInvoices(
  period: PeriodFilter,
  fyStartYear?: number,
): Promise<InvoiceRow[]> {
  await requireAuth();
  const { from, to } = periodRange(period, { fyStartYear });
  // ... rest unchanged
}
```

Same pattern for `listExpenses`.

- [ ] **Step 4: Update `src/app/page.tsx`**

```tsx
import { AppNav } from "@/components/AppNav";
import { BooksLedger } from "@/components/BooksLedger";
import { listExpenses } from "@/app/actions/expenses";
import { listInvoices } from "@/app/actions/invoices";
import { sumReceived } from "@/lib/books";
import {
  currentFyStartYear,
  profit,
  sumAmounts,
  type PeriodFilter,
} from "@/lib/period";

type Props = {
  searchParams: Promise<{ period?: string; fyStart?: string }>;
};

function parsePeriod(value: string | undefined): PeriodFilter {
  if (value === "year" || value === "all" || value === "month" || value === "fy") {
    return value;
  }
  return "fy";
}

function parseFyStart(
  period: PeriodFilter,
  raw: string | undefined,
  now = new Date(),
): number | undefined {
  if (period !== "fy") return undefined;
  const n = raw ? Number(raw) : NaN;
  if (Number.isInteger(n) && n >= 2000 && n <= 2100) return n;
  return currentFyStartYear(now);
}

export default async function BooksPage({ searchParams }: Props) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const fyStartYear = parseFyStart(period, params.fyStart);

  const [invoices, expenses] = await Promise.all([
    listInvoices(period, fyStartYear),
    listExpenses(period, fyStartYear),
  ]);

  const income = sumAmounts(invoices);
  const received = sumReceived(invoices);
  const expenseTotal = sumAmounts(expenses);
  const totals = {
    income,
    received,
    expenses: expenseTotal,
    profit: profit(income, expenseTotal),
  };

  return (
    <div className="min-h-screen bg-[#e8ebe4]">
      <AppNav />
      <BooksLedger
        period={period}
        fyStartYear={fyStartYear ?? null}
        totals={totals}
        invoices={invoices}
        expenses={expenses}
      />
    </div>
  );
}
```

Note: `BooksLedger` props change lands fully in Task 3 — for this task, either stub `fyStartYear` prop on the component with a no-op use, or finish Task 2 + Task 3 in one sitting if TypeScript blocks. Prefer updating the Props type in Task 2 to accept `fyStartYear: number | null` and pass it through even before UI uses ← →.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
npm test
```

Expected: PASS (BooksLedger may need temporary prop addition — add to Props with unused prefix if UI not ready).

- [ ] **Step 6: Commit**

```bash
git add src/lib/books.ts src/lib/books-totals.test.ts src/app/actions/invoices.ts src/app/actions/expenses.ts src/app/page.tsx src/components/BooksLedger.tsx
git commit -m "$(cat <<'EOF'
Wire FY periods and Received totals into Books load path.

EOF
)"
```

---

### Task 3: BooksLedger Hero Profit UI + FY navigation + sheet footers

**Files:**
- Modify: `src/components/BooksLedger.tsx` (primary)

**Interfaces:**
- Consumes: `BooksTotals` with `received`; `period`; `fyStartYear: number | null`; `fyLabel`, `currentFyStartYear` from `@/lib/period`
- Produces: Updated client UI only

- [ ] **Step 1: Update props and period chips**

```ts
type Props = {
  period: PeriodFilter;
  fyStartYear: number | null;
  totals: BooksTotals;
  invoices: InvoiceRow[];
  expenses: ExpenseRow[];
};

const PERIODS: { id: PeriodFilter; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "fy", label: "This FY" },
  { id: "year", label: "Calendar year" },
  { id: "all", label: "All time" },
];
```

Navigation helpers:

```ts
const setPeriod = (next: PeriodFilter) => {
  const params = new URLSearchParams();
  if (next !== "fy") params.set("period", next);
  // default fy omits period for clean URL, OR always set period=fy — prefer always set explicit period for clarity:
  params.set("period", next);
  router.push(`/?${params}`);
};

const shiftFy = (delta: number) => {
  if (fyStartYear == null) return;
  const params = new URLSearchParams();
  params.set("period", "fy");
  params.set("fyStart", String(fyStartYear + delta));
  router.push(`/?${params}`);
};
```

Spec default is current FY when omitted — using explicit `?period=fy` is fine. When switching away from FY, drop `fyStart`.

- [ ] **Step 2: Replace three TotalCards with Hero Profit layout**

Structure:

1. Period chip row (wrap on mobile)
2. When `period === "fy"`: row with `←` / `{fyLabel(fyStartYear!)}` / `→`
3. Hero: dark sage (`bg-[#2f3a2e]` or existing brand green) Profit amount + subtitle period label
4. Grid of three: Invoiced (`totals.income`), Received (`totals.received`), Expenses (`totals.expenses`)
5. If `totals.income > totals.received`: text `"$X still to receive"` using `formatMoney(totals.income - totals.received)`

Copy: subtitle under Books title → `"Invoiced, received, expenses, and profit"` (not “spreadsheet”).

- [ ] **Step 3: Denser sheets + footer totals**

Invoices list — add a footer row inside the `<ul>` (or sibling bar):

```tsx
<div className="flex justify-between border-t border-stone-300/70 bg-[#f4f2ec] px-4 py-2.5 text-sm font-semibold">
  <span>Total invoiced</span>
  <span className="tabular-nums">{formatMoney(totals.income)}</span>
</div>
```

Expenses — same with `totals.expenses` / “Total expenses”.

Keep existing card-ish list rows (do not force a full HTML table unless it clearly improves density); ensure columns read visually as Date · Client · Status · Amount on `sm+` via grid on each row:

```tsx
<li className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[7rem_1fr_6rem_5rem_auto] sm:items-center">
```

- [ ] **Step 4: Manual check (desktop + mobile)**

```bash
npm run dev
```

- Open `/` → should land on FY (or `?period=fy`), hero Profit, three supporting figures  
- Chip Calendar year / Month / All time  
- FY ← → changes `fyStart` and totals  
- “Still to receive” appears when some invoices unpaid  
- **Mobile (~375px / DevTools iPhone):** no horizontal scroll; period chips wrap; totals stack; invoice/expense rows and actions usable; add-expense form single column  


- [ ] **Step 5: Commit**

```bash
git add src/components/BooksLedger.tsx
git commit -m "$(cat <<'EOF'
Redesign Books summary with Hero Profit and FY navigation.

EOF
)"
```

---

### Task 4: Edit expense (server action + inline UI)

**Files:**
- Modify: `src/app/actions/expenses.ts`
- Modify: `src/components/BooksLedger.tsx`
- Create: `src/app/actions/expenses-validation.test.ts` — extract shared validation if needed

**Interfaces:**
- Consumes: existing `createExpense` validation rules
- Produces:
  - `updateExpense(id: string, input: { date: string; description: string; amount: number }): Promise<{ ok: true } | { ok: false; error: string }>`

- [ ] **Step 1: Extract shared validate helper** (top of `expenses.ts` or `src/lib/expense-input.ts`)

```ts
export function parseExpenseInput(input: {
  date: string;
  description: string;
  amount: number;
}): { ok: true; data: { date: string; description: string; amount: number } } | { ok: false; error: string } {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!input.date || !input.description.trim() || !(amount > 0)) {
    return { ok: false, error: "Date, description, and amount are required." };
  }
  return {
    ok: true,
    data: {
      date: input.date,
      description: input.description.trim(),
      amount,
    },
  };
}
```

Use in `createExpense` and `updateExpense`. Unit-test invalid/valid cases with Vitest (pure function — put in `src/lib/expense-input.ts`).

- [ ] **Step 2: Implement `updateExpense`**

```ts
export async function updateExpense(
  id: string,
  input: { date: string; description: string; amount: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const parsed = parseExpenseInput(input);
    if (!parsed.ok) return parsed;

    const { error } = await getSupabase()
      .from("expenses")
      .update(parsed.data)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t update expense.",
    };
  }
}
```

- [ ] **Step 3: Inline edit UI in BooksLedger**

State:

```ts
const [editingId, setEditingId] = useState<string | null>(null);
const [editDate, setEditDate] = useState("");
const [editDesc, setEditDesc] = useState("");
const [editAmount, setEditAmount] = useState("");
```

On Edit click: populate fields from row, set `editingId`.  
When `editingId === row.id`, replace row with a mini form (date / description / amount / Save / Cancel).  
Save calls `updateExpense`; on failure `flash(error)` and keep edit open with prior field values (do not clear row data from list — list still has original until refresh).  
On success: clear editing, flash “Expense updated.”, `router.refresh()`.

- [ ] **Step 4: Manual check** — edit an expense, cancel, delete still works, create still works.

- [ ] **Step 5: Commit**

```bash
git add src/lib/expense-input.ts src/lib/expense-input.test.ts src/app/actions/expenses.ts src/components/BooksLedger.tsx
git commit -m "$(cat <<'EOF'
Allow editing expenses on Books.

EOF
)"
```

---

### Task 5: CONTEXT.md language + smoke build

**Files:**
- Modify: `CONTEXT.md`
- Verify: `npm test`, `npm run build`

- [ ] **Step 1: Update CONTEXT.md**

Under **Books**, expand to mention periods (This month / This FY / Calendar year / All time), **Invoiced**, **Received** (Paid invoices), and that Profit uses Invoiced − Expenses.

Add:

```markdown
**Invoiced**:
Sum of saved invoice amounts in the selected period. Counts when the invoice is saved.
_Avoid_: Revenue, turnover

**Received**:
Sum of invoice amounts with status Paid in the selected period.
_Avoid_: Cash, collected, cleared

**Financial year (FY)**:
Australian FY 1 July – 30 June, labelled e.g. FY 2025–26. Default Books period.
_Avoid_: Tax year (unless talking to accountant informally)
```

Keep avoiding dashboard / spreadsheet / accounting in product UI copy.

- [ ] **Step 2: Final verification**

```bash
npm test
npm run build
```

Expected: all tests pass; Next.js build succeeds.

- [ ] **Step 3: Commit**

```bash
git add CONTEXT.md
git commit -m "$(cat <<'EOF'
Document Books FY, Invoiced, and Received language.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| AU FY period + label + ← → | 1, 2, 3 |
| Calendar year + month + all | 1, 3 |
| Default current FY | 2 |
| Hero Profit + Invoiced / Received / Expenses | 3 |
| Profit = Invoiced − Expenses | 2 (unchanged formula) |
| Still to receive cue | 3 |
| Sheet footer totals | 3 |
| Expense edit | 4 |
| No export / no categories / no migration | — (out of scope, not implemented) |
| CONTEXT.md | 5 |

## Self-review notes

- No placeholders left; FY URL scheme matches spec (`fyStart=YYYY`).
- `listInvoices` / `listExpenses` signatures updated consistently in Task 2.
- `income` field name kept in `BooksTotals` for code churn; UI label is **Invoiced**.
