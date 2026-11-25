import { sumReceived } from "@/lib/books";
import {
  formatLongDate,
  periodRange,
  periodTitle,
  profit,
  sumAmounts,
  type PeriodFilter,
  type PeriodRangeOptions,
} from "@/lib/period";

export const profitReceivedNote =
  "Profit is invoiced plus cash jobs, minus expenses. Received is the sum of invoices marked Paid in this period. Paid status does not change Profit.";

export type StatementExpense = {
  date: string;
  description: string;
  amount: number;
};

export type ProfitLossStatement = {
  period: PeriodFilter;
  periodLabel: string;
  from: string | null;
  to: string | null;
  rangeLabel: string;
  invoiced: number;
  cashJobs: number;
  totalIncome: number;
  expenses: StatementExpense[];
  totalExpenses: number;
  profit: number;
  received: number;
};

type StatementInput = {
  period: PeriodFilter;
  invoices: { amount: number | string; status: string }[];
  expenses: {
    date: string;
    description: string;
    amount: number | string;
    created_at?: string;
  }[];
  cashJobs: { amount: number | string }[];
} & PeriodRangeOptions;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildProfitLossStatement(input: StatementInput): ProfitLossStatement {
  const options = { now: input.now, fyStartYear: input.fyStartYear };
  const range = periodRange(input.period, options);
  const invoiced = sumAmounts(input.invoices);
  const cashJobs = sumAmounts(input.cashJobs);
  const expenses = [...input.expenses]
    .sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return (a.created_at ?? "").localeCompare(b.created_at ?? "");
    })
    .map((row) => ({
      date: row.date,
      description: row.description.trim(),
      amount: roundMoney(Number(row.amount || 0)),
    }));
  const totalExpenses = sumAmounts(expenses);
  const totalIncome = roundMoney(invoiced + cashJobs);

  return {
    period: input.period,
    periodLabel: periodTitle(input.period, options),
    from: range.from,
    to: range.to,
    rangeLabel:
      range.from && range.to
        ? `${formatLongDate(range.from)} – ${formatLongDate(range.to)}`
        : "All dates",
    invoiced,
    cashJobs,
    totalIncome,
    expenses,
    totalExpenses,
    profit: profit(invoiced, totalExpenses, cashJobs),
    received: sumReceived(input.invoices),
  };
}

export function statementPdfFilename(statement: Pick<ProfitLossStatement, "periodLabel">): string {
  const slug = statement.periodLabel
    .replace(/\u2013/g, "-")
    .replace(/[^\w]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `Radiant-Rooms-Co-Profit-and-loss-${slug}.pdf`;
}
