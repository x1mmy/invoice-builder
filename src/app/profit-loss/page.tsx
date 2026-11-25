import { listCashJobs } from "@/app/actions/cash-jobs";
import { listExpenses } from "@/app/actions/expenses";
import { listInvoices } from "@/app/actions/invoices";
import { AppNav } from "@/components/AppNav";
import { ProfitLossView } from "@/components/ProfitLossView";
import { currentFyStartYear, type PeriodFilter } from "@/lib/period";
import { buildProfitLossStatement } from "@/lib/profit-loss";

type Props = {
  searchParams: Promise<{ period?: string; fyStart?: string }>;
};

export const metadata = {
  title: "Profit & loss — Radiant Rooms Co",
};

function parsePeriod(value: string | undefined): PeriodFilter {
  if (
    value === "year" ||
    value === "all" ||
    value === "month" ||
    value === "fy" ||
    value === "3m" ||
    value === "6m" ||
    value === "12m"
  ) {
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

export default async function ProfitLossPage({ searchParams }: Props) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const fyStartYear = parseFyStart(period, params.fyStart);

  const [invoices, expenses, cashJobs] = await Promise.all([
    listInvoices(period, fyStartYear),
    listExpenses(period, fyStartYear),
    listCashJobs(period, fyStartYear),
  ]);

  const statement = buildProfitLossStatement({
    period,
    fyStartYear,
    invoices,
    expenses,
    cashJobs,
  });

  return (
    <div className="min-h-screen bg-[#e8ebe4]">
      <AppNav />
      <ProfitLossView statement={statement} fyStartYear={fyStartYear ?? null} />
    </div>
  );
}
