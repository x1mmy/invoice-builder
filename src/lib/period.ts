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
