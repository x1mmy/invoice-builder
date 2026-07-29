export type PeriodFilter = "month" | "year" | "all";

type DateRange = { from: string | null; to: string | null };

/** Inclusive ISO date bounds (YYYY-MM-DD) for the selected period. */
export function periodRange(period: PeriodFilter, now = new Date()): DateRange {
  if (period === "all") {
    return { from: null, to: null };
  }

  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  if (period === "year") {
    return {
      from: `${y}-01-01`,
      to: `${y}-12-31`,
    };
  }

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
