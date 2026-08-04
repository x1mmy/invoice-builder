"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { createExpense, deleteExpense } from "@/app/actions/expenses";
import { deleteInvoice, updateInvoiceStatus } from "@/app/actions/invoices";
import type { BooksTotals, ExpenseRow, InvoiceRow } from "@/lib/books";
import { formatMoney, formatDisplayDate } from "@/lib/calc";
import type { PeriodFilter } from "@/lib/period";

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
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
];

export function BooksLedger({
  period,
  fyStartYear: _fyStartYear,
  totals,
  invoices,
  expenses,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("invoices");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [expDate, setExpDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const setPeriod = (next: PeriodFilter) => {
    const params = new URLSearchParams();
    if (next !== "month") params.set("period", next);
    router.push(params.toString() ? `/?${params}` : "/");
  };

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

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-800">
            Books
          </h1>
          <p className="text-sm text-stone-500">Income, expenses, and profit</p>
        </div>
        <div className="flex rounded-lg border border-stone-300/80 bg-white/70 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                period === p.id
                  ? "bg-[#5f7a64] text-white"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TotalCard label="Income" value={totals.income} tone="income" />
        <TotalCard label="Expenses" value={totals.expenses} tone="expense" />
        <TotalCard label="Profit" value={totals.profit} tone="profit" />
      </section>

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
            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-semibold capitalize ${
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
              className="rounded-md bg-[#5f7a64] px-3 py-2 text-sm font-semibold text-white"
            >
              New invoice
            </Link>
          </div>
          {invoices.length === 0 ? (
            <EmptyState text="No invoices in this period yet." />
          ) : (
            <ul className="divide-y divide-stone-200/80 overflow-hidden rounded-xl border border-stone-300/70 bg-white/70">
              {invoices.map((row) => (
                <li key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <Link href={`/invoice/${row.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-800">
                      {row.client_name}
                      <span className="ml-2 text-sm font-normal text-stone-400">
                        #{row.invoice_number}
                      </span>
                    </p>
                    <p className="text-sm text-stone-500">
                      {formatDisplayDate(row.invoice_date)}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold tabular-nums text-stone-800">
                      {formatMoney(row.amount)}
                    </p>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onTogglePaid(row)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        row.status === "Paid"
                          ? "bg-[#5f7a64]/15 text-[#3f5544]"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {row.status === "Paid" ? "Paid" : "Mark paid"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDeleteInvoice(row)}
                      className="rounded-md px-2 py-1 text-xs text-stone-400 hover:text-red-700"
                      aria-label="Delete invoice"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Add expense
          </h2>
          <form
            onSubmit={onAddExpense}
            className="grid gap-3 rounded-xl border border-stone-300/70 bg-white/70 p-4 sm:grid-cols-[1fr_2fr_1fr_auto]"
          >
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-500">Date</span>
              <input
                type="date"
                required
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-500">Description</span>
              <input
                type="text"
                required
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="e.g. Cleaning supplies"
                className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-stone-500">Amount</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md bg-[#5f7a64] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
              >
                Save
              </button>
            </div>
          </form>

          {expenses.length === 0 ? (
            <EmptyState text="No expenses in this period yet." />
          ) : (
            <ul className="divide-y divide-stone-200/80 overflow-hidden rounded-xl border border-stone-300/70 bg-white/70">
              {expenses.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-800">{row.description}</p>
                    <p className="text-sm text-stone-500">{formatDisplayDate(row.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold tabular-nums text-stone-800">
                      {formatMoney(Number(row.amount))}
                    </p>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDeleteExpense(row)}
                      className="rounded-md px-2 py-1 text-xs text-stone-400 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function TotalCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "profit";
}) {
  const color =
    tone === "profit"
      ? value >= 0
        ? "text-[#3f5544]"
        : "text-red-700"
      : "text-stone-800";

  return (
    <div className="rounded-xl border border-stone-300/70 bg-[#f4f2ec] px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tabular-nums ${color}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-stone-300 bg-white/40 px-4 py-10 text-center text-sm text-stone-500">
      {text}
    </p>
  );
}
