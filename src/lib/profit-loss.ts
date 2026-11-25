import { sumReceived } from "@/lib/books";
import type { ExpenseKind } from "@/lib/expense-input";
import {
  australianDateString,
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

export const donationNote =
  "Donations reduce profit on this statement. Ask the accountant whether a donation can be claimed.";

export type StatementExpense = {
  date: string;
  description: string;
  amount: number;
  kind: ExpenseKind;
  note: string;
};

export type ProfitLossStatement = {
  period: PeriodFilter;
  periodLabel: string;
  from: string | null;
  to: string | null;
  rangeLabel: string;
  yearToDate: boolean;
  preparedLabel: string;
  invoiced: number;
  cashJobs: number;
  totalIncome: number;
  expenses: StatementExpense[];
  operatingExpenses: StatementExpense[];
  donations: StatementExpense[];
  totalOperating: number;
  totalDonations: number;
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
    kind?: ExpenseKind;
    note?: string;
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
    .map((row) => {
      const kind: ExpenseKind = row.kind === "donation" ? "donation" : "operating";
      return {
        date: row.date,
        description: row.description.trim(),
        amount: roundMoney(Number(row.amount || 0)),
        kind,
        note: (row.note ?? "").trim(),
      };
    });
  const operatingExpenses = expenses.filter((row) => row.kind === "operating");
  const donations = expenses.filter((row) => row.kind === "donation");
  const totalOperating = sumAmounts(operatingExpenses);
  const totalDonations = sumAmounts(donations);
  const totalExpenses = roundMoney(totalOperating + totalDonations);
  const totalIncome = roundMoney(invoiced + cashJobs);
  const preparedOn = australianDateString(options.now ?? new Date());

  return {
    period: input.period,
    periodLabel: periodTitle(input.period, options),
    from: range.from,
    to: range.to,
    rangeLabel:
      range.from && range.to
        ? `${formatLongDate(range.from)} – ${formatLongDate(range.to)}`
        : "All dates",
    yearToDate: isCurrentFyToDate(input.period, range.from, range.to),
    preparedLabel: `Prepared ${formatLongDate(preparedOn)}`,
    invoiced,
    cashJobs,
    totalIncome,
    expenses,
    operatingExpenses,
    donations,
    totalOperating,
    totalDonations,
    totalExpenses,
    profit: profit(invoiced, totalExpenses, cashJobs),
    received: sumReceived(input.invoices),
  };
}

function isCurrentFyToDate(
  period: PeriodFilter,
  from: string | null,
  to: string | null,
): boolean {
  if (period !== "fy" || !from || !to) return false;
  const start = Number(from.slice(0, 4));
  return to !== `${start + 1}-06-30`;
}

export function statementPdfFilename(statement: Pick<ProfitLossStatement, "periodLabel">): string {
  const slug = statement.periodLabel
    .replace(/\u2013/g, "-")
    .replace(/[^\w]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `Radiant-Rooms-Co-Profit-and-loss-${slug}.pdf`;
}
