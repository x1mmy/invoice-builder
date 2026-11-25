"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BUSINESS } from "@/lib/business";
import { formatMoney } from "@/lib/calc";
import { formatLongDate, fyLabel, type PeriodFilter } from "@/lib/period";
import {
  donationNote,
  profitReceivedNote,
  type ProfitLossStatement,
  type StatementExpense,
} from "@/lib/profit-loss";
import { downloadStatementPdf } from "@/lib/profit-loss-pdf";

type Props = {
  statement: ProfitLossStatement;
  fyStartYear: number | null;
};

const PERIODS: { id: PeriodFilter; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "fy", label: "This FY" },
  { id: "year", label: "Calendar year" },
  { id: "3m", label: "Last 3 months" },
  { id: "6m", label: "Last 6 months" },
  { id: "12m", label: "Last 12 months" },
  { id: "all", label: "All time" },
];

export function ProfitLossView({ statement, fyStartYear }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPeriod = (next: PeriodFilter) => {
    const params = new URLSearchParams();
    params.set("period", next);
    router.push(`/profit-loss?${params.toString()}`);
  };

  const shiftFy = (delta: number) => {
    if (fyStartYear == null) return;
    const params = new URLSearchParams();
    params.set("period", "fy");
    params.set("fyStart", String(fyStartYear + delta));
    router.push(`/profit-loss?${params.toString()}`);
  };

  const onDownload = () => {
    setError(null);
    setPending(true);
    downloadStatementPdf(statement)
      .catch(() => setError("Could not download the PDF. Try again."))
      .finally(() => setPending(false));
  };

  return (
    <div className="mx-auto max-w-[210mm] space-y-5 px-4 py-6 sm:px-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-800">
              Profit & loss
            </h1>
            <p className="text-sm text-stone-500">
              Income, expenses, and profit for the period you choose
            </p>
          </div>
          <button
            type="button"
            onClick={onDownload}
            disabled={pending}
            className="inline-flex min-h-11 items-center rounded-md bg-[#5f7a64] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Statement period">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              aria-pressed={statement.period === item.id}
              className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                statement.period === item.id
                  ? "border-[#5f7a64] bg-[#5f7a64] text-white"
                  : "border-stone-300/80 bg-white/70 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {statement.period === "fy" && fyStartYear != null ? (
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

        {error ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </header>

      <article className="border border-[#eaeaea] bg-white px-5 py-8 text-[#2f3437] sm:px-12 sm:py-12">
        <p className="text-sm font-semibold tracking-wide">{BUSINESS.name}</p>
        <p className="mt-1 text-sm text-stone-700">{BUSINESS.owner}</p>
        <p className="mt-0.5 text-xs text-stone-500">ABN {BUSINESS.abn}</p>
        <p className="mt-8 font-[family-name:var(--font-display)] text-4xl font-semibold leading-none">
          Profit & loss
        </p>
        <p className="mt-3 text-sm font-semibold">{statement.periodLabel}</p>
        {statement.yearToDate ? (
          <p className="mt-1 text-sm font-semibold">Year to date</p>
        ) : null}
        <p className="mt-1 text-sm text-stone-500">{statement.rangeLabel}</p>
        <p className="mt-1 text-xs text-stone-500">{statement.preparedLabel}</p>
        <div className="mt-4 h-0.5 bg-[#5f7a64]" />

        <section className="mt-6" aria-labelledby="pl-income">
          <h2
            id="pl-income"
            className="text-xs font-semibold tracking-[0.14em] text-[#5f7a64]"
          >
            INCOME
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <AmountLine label="Invoiced" amount={statement.invoiced} />
            <AmountLine label="Cash jobs" amount={statement.cashJobs} />
          </dl>
          <div className="mt-3 border-t border-stone-200 pt-2">
            <AmountLine label="Total income" amount={statement.totalIncome} strong />
          </div>
        </section>

        <ExpenseGroup
          id="pl-operating"
          title="Operating expenses"
          rows={statement.operatingExpenses}
          totalLabel="Total operating expenses"
          total={statement.totalOperating}
        />
        <ExpenseGroup
          id="pl-donations"
          title="Donations"
          rows={statement.donations}
          totalLabel="Total donations"
          total={statement.totalDonations}
          note={donationNote}
        />
        <div className="mt-3 border-t border-stone-200 pt-2">
          <AmountLine
            label="Total expenses"
            amount={statement.totalExpenses}
            strong
          />
        </div>

        <section className="mt-8 border-t-2 border-[#5f7a64] pt-4" aria-labelledby="pl-profit">
          <h2 id="pl-profit" className="sr-only">
            Profit
          </h2>
          <AmountLine label="Profit" amount={statement.profit} hero />
          <p className="mt-4 text-sm leading-relaxed text-stone-500">
            {profitReceivedNote}
          </p>
          <div className="mt-3">
            <AmountLine label="Received" amount={statement.received} />
          </div>
        </section>
      </article>
    </div>
  );
}

function ExpenseGroup({
  id,
  title,
  rows,
  totalLabel,
  total,
  note,
}: {
  id: string;
  title: string;
  rows: StatementExpense[];
  totalLabel: string;
  total: number;
  note?: string;
}) {
  return (
    <section className="mt-8" aria-labelledby={id}>
      <h2
        id={id}
        className="text-xs font-semibold tracking-[0.14em] text-[#5f7a64]"
      >
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">None in this period.</p>
      ) : (
        <div className="mt-3">
          <div className="grid grid-cols-[5.8rem_minmax(0,1fr)_auto] gap-x-4 border-b border-[#eaeaea] pb-2 text-[11px] font-medium tracking-[0.08em] text-[#787774]">
            <span>DATE</span>
            <span>DESCRIPTION</span>
            <span className="text-right">AMOUNT</span>
          </div>
          <ul>
            {rows.map((row, index) => (
              <li
                key={`${row.kind}-${row.date}-${index}`}
                className="grid grid-cols-[5.8rem_minmax(0,1fr)_auto] items-baseline gap-x-4 py-2.5 text-sm leading-6"
              >
                <span className="text-stone-600">{formatLongDate(row.date)}</span>
                <span className="min-w-0 break-words">
                  {row.description || "—"}
                  {row.note ? (
                    <span className="mt-0.5 block text-xs leading-5 text-stone-500">
                      {row.note}
                    </span>
                  ) : null}
                </span>
                <span className="text-right tabular-nums">
                  {formatMoney(row.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3 border-t border-stone-200 pt-2">
        <AmountLine label={totalLabel} amount={total} strong />
      </div>
      {note ? <p className="mt-2 text-xs leading-5 text-stone-500">{note}</p> : null}
    </section>
  );
}

function AmountLine({
  label,
  amount,
  strong = false,
  hero = false,
}: {
  label: string;
  amount: number;
  strong?: boolean;
  hero?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        hero
          ? "font-[family-name:var(--font-display)] text-3xl font-semibold"
          : strong
            ? "text-sm font-semibold"
            : "text-sm"
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{formatMoney(amount)}</span>
    </div>
  );
}
