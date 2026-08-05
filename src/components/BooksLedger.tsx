"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { createExpense, deleteExpense, updateExpense } from "@/app/actions/expenses";
import { deleteInvoice, updateInvoiceStatus } from "@/app/actions/invoices";
import type { BooksTotals, ExpenseRow, InvoiceRow } from "@/lib/books";
import { formatMoney, formatDisplayDate } from "@/lib/calc";
import { australianDateString, fyLabel, type PeriodFilter } from "@/lib/period";

type Tab = "invoices" | "expenses";

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

export function BooksLedger({
  period,
  fyStartYear,
  totals,
  invoices,
  expenses,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("invoices");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [expDate, setExpDate] = useState(() => australianDateString());
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const setPeriod = (next: PeriodFilter) => {
    const params = new URLSearchParams();
    params.set("period", next);
    router.push(`/?${params.toString()}`);
  };

  const shiftFy = (delta: number) => {
    if (fyStartYear == null) return;
    const params = new URLSearchParams();
    params.set("period", "fy");
    params.set("fyStart", String(fyStartYear + delta));
    router.push(`/?${params.toString()}`);
  };

  const periodLabel =
    period === "fy" && fyStartYear != null
      ? fyLabel(fyStartYear)
      : (PERIODS.find(({ id }) => id === period)?.label ?? "");

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3500);
  };

  const onTogglePaid = (row: InvoiceRow) => {
    const next = row.status === "Paid" ? "Due on receipt" : "Paid";
    startTransition(async () => {
      const result = await updateInvoiceStatus(row.id, next);
      if (!result.ok) flash(result.error);
      else router.refresh();
    });
  };

  const onDeleteInvoice = (row: InvoiceRow) => {
    if (!window.confirm(`Remove invoice ${row.invoice_number} from Books?`)) return;
    startTransition(async () => {
      const result = await deleteInvoice(row.id);
      if (!result.ok) flash(result.error);
      else {
        flash("Invoice removed.");
        router.refresh();
      }
    });
  };

  const onAddExpense = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createExpense({
        date: expDate,
        description: expDesc,
        amount: Number(expAmount),
      });
      if (!result.ok) {
        flash(result.error);
        return;
      }
      setExpDesc("");
      setExpAmount("");
      flash("Expense saved.");
      router.refresh();
    });
  };

  const onDeleteExpense = (row: ExpenseRow) => {
    if (!window.confirm(`Delete expense “${row.description}”?`)) return;
    startTransition(async () => {
      const result = await deleteExpense(row.id);
      if (!result.ok) flash(result.error);
      else {
        flash("Expense deleted.");
        router.refresh();
      }
    });
  };

  const startEditExpense = (row: ExpenseRow) => {
    setEditingId(row.id);
    setEditDate(row.date);
    setEditDesc(row.description);
    setEditAmount(String(row.amount));
  };

  const cancelEditExpense = () => {
    setEditingId(null);
  };

  const onSaveExpense = (e: FormEvent) => {
    e.preventDefault();
    if (editingId == null) return;
    const savedDate = editDate;
    const savedDesc = editDesc;
    const savedAmount = editAmount;
    startTransition(async () => {
      const result = await updateExpense(editingId, {
        date: savedDate,
        description: savedDesc,
        amount: Number(savedAmount),
      });
      if (!result.ok) {
        flash(result.error);
        setEditDate(savedDate);
        setEditDesc(savedDesc);
        setEditAmount(savedAmount);
        return;
      }
      setEditingId(null);
      flash("Expense updated.");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <header className="space-y-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-800">
            Books
          </h1>
          <p className="text-sm text-stone-500">
            Invoiced, received, expenses, and profit
          </p>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Books period">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
              className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                period === p.id
                  ? "border-[#5f7a64] bg-[#5f7a64] text-white"
                  : "border-stone-300/80 bg-white/70 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period === "fy" && fyStartYear != null ? (
          <div className="flex items-center justify-between rounded-lg border border-stone-300/80 bg-white/60 p-1">
            <button
              type="button"
              onClick={() => shiftFy(-1)}
              className="min-h-11 min-w-11 rounded-md text-lg text-stone-600 hover:bg-stone-100"
              aria-label="Previous financial year"
            >
              ←
            </button>
            <p className="px-2 text-sm font-semibold text-stone-700">
              {fyLabel(fyStartYear)}
            </p>
            <button
              type="button"
              onClick={() => shiftFy(1)}
              className="min-h-11 min-w-11 rounded-md text-lg text-stone-600 hover:bg-stone-100"
              aria-label="Next financial year"
            >
              →
            </button>
          </div>
        ) : null}
      </header>

      <section
        className="rounded-2xl bg-[#2f3a2e] px-5 py-6 text-[#f7f6f1] shadow-sm sm:px-6 sm:py-7"
        aria-labelledby="profit-heading"
      >
        <p id="profit-heading" className="text-sm font-medium text-[#d7ddd3]">
          Profit
        </p>
        <p className="mt-1 break-words font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tabular-nums sm:text-5xl">
          {formatMoney(totals.profit)}
        </p>
        <p className="mt-2 text-sm text-[#bdc7b9]">{periodLabel}</p>
      </section>

      <dl className="grid grid-cols-1 overflow-hidden rounded-xl border border-stone-300/70 bg-[#f4f2ec] shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-stone-300/70">
        <SupportingFigure label="Invoiced" value={totals.income} />
        <SupportingFigure label="Received" value={totals.received} />
        <SupportingFigure label="Expenses" value={totals.expenses} />
      </dl>

      {totals.income > totals.received ? (
        <p className="text-sm font-medium text-stone-600">
          {formatMoney(totals.income - totals.received)} still to receive
        </p>
      ) : null}

      {message ? (
        <p className="rounded-md bg-white/80 px-3 py-2 text-sm text-stone-700 shadow-sm" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex gap-1 rounded-lg border border-stone-300/80 bg-[#f4f2ec] p-1">
        {(["invoices", "expenses"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-11 flex-1 rounded-md px-3 py-2.5 text-sm font-semibold capitalize ${
              tab === id ? "bg-white text-stone-800 shadow-sm" : "text-stone-500"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      {tab === "invoices" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Invoices
            </h2>
            <Link
              href="/invoice/new"
              className="inline-flex min-h-11 items-center rounded-md bg-[#5f7a64] px-3 py-2 text-sm font-semibold text-white"
            >
              New invoice
            </Link>
          </div>
          {invoices.length === 0 ? (
            <SheetWithTotal label="Total invoiced" value={totals.income}>
              <EmptyState text="No invoices in this period yet." />
            </SheetWithTotal>
          ) : (
            <SheetWithTotal label="Total invoiced" value={totals.income}>
              <ul className="divide-y divide-stone-200/80">
                {invoices.map((row) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_6rem_5.5rem_auto] sm:items-center sm:gap-3"
                  >
                    <p className="text-sm text-stone-500">
                      {formatDisplayDate(row.invoice_date)}
                    </p>
                    <Link href={`/invoice/${row.id}`} className="min-w-0">
                      <p className="truncate font-medium text-stone-800">
                        {row.client_name}
                      </p>
                      <p className="truncate text-sm text-stone-400">
                        #{row.invoice_number}
                      </p>
                    </Link>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onTogglePaid(row)}
                      className={`min-h-11 justify-self-start rounded-full px-3 py-1 text-xs font-semibold ${
                        row.status === "Paid"
                          ? "bg-[#5f7a64]/15 text-[#3f5544]"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {row.status === "Paid" ? "Paid" : "Mark paid"}
                    </button>
                    <p className="break-all font-semibold tabular-nums text-stone-800 sm:text-right">
                      {formatMoney(row.amount)}
                    </p>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDeleteInvoice(row)}
                      className="min-h-11 justify-self-start rounded-md px-2 text-xs text-stone-500 hover:text-red-700"
                      aria-label="Delete invoice"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </SheetWithTotal>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Add expense
          </h2>
          <form
            onSubmit={onAddExpense}
            className="grid gap-3 rounded-xl border border-stone-300/70 bg-white/70 p-4 md:grid-cols-[1fr_2fr_1fr_auto]"
          >
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-medium text-stone-500">Date</span>
              <input
                type="date"
                required
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-medium text-stone-500">Description</span>
              <input
                type="text"
                required
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="e.g. Cleaning supplies"
                className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-xs font-medium text-stone-500">Amount</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={pending}
                className="min-h-11 w-full rounded-md bg-[#5f7a64] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 md:w-auto"
              >
                Save
              </button>
            </div>
          </form>

          {expenses.length === 0 ? (
            <SheetWithTotal label="Total expenses" value={totals.expenses}>
              <EmptyState text="No expenses in this period yet." />
            </SheetWithTotal>
          ) : (
            <SheetWithTotal label="Total expenses" value={totals.expenses}>
              <ul className="divide-y divide-stone-200/80">
                {expenses.map((row) =>
                  editingId === row.id ? (
                    <li key={row.id} className="px-4 py-3">
                      <form
                        onSubmit={onSaveExpense}
                        className="grid gap-3 md:grid-cols-[1fr_2fr_1fr_auto_auto]"
                      >
                        <label className="min-w-0 space-y-1">
                          <span className="text-xs font-medium text-stone-500">Date</span>
                          <input
                            type="date"
                            required
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
                          />
                        </label>
                        <label className="min-w-0 space-y-1">
                          <span className="text-xs font-medium text-stone-500">
                            Description
                          </span>
                          <input
                            type="text"
                            required
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
                          />
                        </label>
                        <label className="min-w-0 space-y-1">
                          <span className="text-xs font-medium text-stone-500">Amount</span>
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
                          />
                        </label>
                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={pending}
                            className="min-h-11 w-full rounded-md bg-[#5f7a64] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 md:w-auto"
                          >
                            Save
                          </button>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={cancelEditExpense}
                            className="min-h-11 w-full rounded-md border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-60 md:w-auto"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </li>
                  ) : (
                    <li
                      key={row.id}
                      className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_5.5rem_auto] sm:items-center sm:gap-3"
                    >
                      <p className="text-sm text-stone-500">
                        {formatDisplayDate(row.date)}
                      </p>
                      <p className="min-w-0 break-words font-medium text-stone-800">
                        {row.description}
                      </p>
                      <p className="break-all font-semibold tabular-nums text-stone-800 sm:text-right">
                        {formatMoney(Number(row.amount))}
                      </p>
                      <div className="flex flex-wrap gap-1 sm:justify-end">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => startEditExpense(row)}
                          className="min-h-11 rounded-md px-2 text-xs text-stone-500 hover:text-stone-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onDeleteExpense(row)}
                          className="min-h-11 rounded-md px-2 text-xs text-stone-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            </SheetWithTotal>
          )}
        </section>
      )}
    </div>
  );
}

function SupportingFigure({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border-b border-stone-300/70 px-4 py-4 last:border-b-0 sm:border-b-0">
      <dt className="text-sm font-medium text-stone-500">{label}</dt>
      <dd className="mt-1 break-all font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums text-stone-800">
        {formatMoney(value)}
      </dd>
    </div>
  );
}

function SheetWithTotal({
  label,
  value,
  children,
}: {
  label: string;
  value: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-300/70 bg-white/70">
      {children}
      <div className="flex items-center justify-between gap-4 border-t border-stone-300/70 bg-[#f4f2ec] px-4 py-2.5 text-sm font-semibold text-stone-800">
        <span>{label}</span>
        <span className="min-w-0 break-all text-right tabular-nums">
          {formatMoney(value)}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="px-4 py-10 text-center text-sm text-stone-500">
      {text}
    </p>
  );
}
