export type PeriodFilter = "month" | "fy" | "year" | "all";

export type PeriodRangeOptions = {
  now?: Date;
  fyStartYear?: number;
};

type DateRange = { from: string | null; to: string | null };

export function civilPartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

export function australianDateString(date = new Date()): string {
  const { year, month, day } = civilPartsInTimeZone(date, "Australia/Sydney");
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Calendar year in which the Australian FY begins (1 July). */
export function currentFyStartYear(now = new Date()): number {
  const { year, month } = civilPartsInTimeZone(now, "Australia/Sydney");
  return month >= 7 ? year : year - 1;
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

  const { year, month } = civilPartsInTimeZone(now, "Australia/Sydney");

  if (period === "fy") {
    const start = options.fyStartYear ?? currentFyStartYear(now);
    return {
      from: `${start}-07-01`,
      to: `${start + 1}-06-30`,
    };
  }

  if (period === "year") {
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    };
  }

  // month
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const mm = String(month).padStart(2, "0");
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function sumAmounts(rows: { amount: number | string }[]): number {
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return Math.round(total * 100) / 100;
}

/** Invoiced + cash jobs − expenses. Paid status does not change profit. */
export function profit(
  income: number,
  expenses: number,
  cashJobs = 0,
): number {
  return Math.round((income + cashJobs - expenses) * 100) / 100;
}
