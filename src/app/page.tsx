import { AppNav } from "@/components/AppNav";
import { BooksLedger } from "@/components/BooksLedger";
import { listCashJobs } from "@/app/actions/cash-jobs";
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

  const [invoices, expenses, cashJobs] = await Promise.all([
    listInvoices(period, fyStartYear),
    listExpenses(period, fyStartYear),
    listCashJobs(period, fyStartYear),
  ]);

  const income = sumAmounts(invoices);
  const received = sumReceived(invoices);
  const expenseTotal = sumAmounts(expenses);
  const cashJobTotal = sumAmounts(cashJobs);
  const totals = {
    income,
    received,
    expenses: expenseTotal,
    cashJobs: cashJobTotal,
    profit: profit(income, expenseTotal, cashJobTotal),
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
