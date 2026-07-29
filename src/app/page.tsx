import { AppNav } from "@/components/AppNav";
import { BooksLedger } from "@/components/BooksLedger";
import { listExpenses } from "@/app/actions/expenses";
import { listInvoices } from "@/app/actions/invoices";
import { profit, sumAmounts, type PeriodFilter } from "@/lib/period";

type Props = {
  searchParams: Promise<{ period?: string }>;
};

function parsePeriod(value: string | undefined): PeriodFilter {
  if (value === "year" || value === "all" || value === "month") return value;
  return "month";
}

export default async function BooksPage({ searchParams }: Props) {
  const params = await searchParams;
  const period = parsePeriod(params.period);

  const [invoices, expenses] = await Promise.all([
    listInvoices(period),
    listExpenses(period),
  ]);

  const income = sumAmounts(invoices);
  const expenseTotal = sumAmounts(expenses);
  const totals = {
    income,
    expenses: expenseTotal,
    profit: profit(income, expenseTotal),
  };

  return (
    <div className="min-h-screen bg-[#e8ebe4]">
      <AppNav />
      <BooksLedger
        period={period}
        totals={totals}
        invoices={invoices}
        expenses={expenses}
      />
    </div>
  );
}
