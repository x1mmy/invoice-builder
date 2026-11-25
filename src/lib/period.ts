export type PeriodFilter = "month" | "fy" | "year" | "all" | "3m" | "6m" | "12m";

export type PeriodRangeOptions = {
  now?: Date;
  fyStartYear?: number;
};

type DateRange = { from: string | null; to: string | null };

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const TRAILING_MONTHS: Partial<Record<PeriodFilter, number>> = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Shift a calendar month by `delta` months. `month` is 1–12. */
function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  const shiftedYear = Math.floor(index / 12);
  const shiftedMonth = index - shiftedYear * 12 + 1;
  return { year: shiftedYear, month: shiftedMonth };
}

/** Inclusive range ending today (Sydney), starting on the 1st of the month
 * that is `months - 1` months earlier, so the current month is included. */
function trailingMonthsRange(months: number, now: Date): DateRange {
  const { year, month, day } = civilPartsInTimeZone(now, "Australia/Sydney");
  const start = shiftMonth(year, month, -(months - 1));
  return {
    from: `${start.year}-${pad(start.month)}-01`,
    to: `${year}-${pad(month)}-${pad(day)}`,
  };
}

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

/** e.g. "2026-09-01" → "1 Sep 2026" */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return iso;
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
}

export function periodTitle(
  period: PeriodFilter,
  options: PeriodRangeOptions = {},
): string {
  if (period === "fy") {
    const start = options.fyStartYear ?? currentFyStartYear(options.now ?? new Date());
    return fyLabel(start);
  }
  if (period === "month") return "This month";
  if (period === "year") return "Calendar year";
  if (period === "all") return "All time";
  if (period === "3m") return "Last 3 months";
  if (period === "6m") return "Last 6 months";
  return "Last 12 months";
}

/** Current financial year ends today. A finished year still ends on 30 June. */
function financialYearRange(start: number, now: Date) {
  const from = `${start}-07-01`;
  const fullEnd = `${start + 1}-06-30`;
  const today = australianDateString(now);
  const yearToDate = start === currentFyStartYear(now) && today < fullEnd;
  return { from, to: yearToDate ? today : fullEnd, yearToDate };
}

export function isYearToDate(
  period: PeriodFilter,
  options: PeriodRangeOptions = {},
): boolean {
  if (period !== "fy") return false;
  const now = options.now ?? new Date();
  const start = options.fyStartYear ?? currentFyStartYear(now);
  return financialYearRange(start, now).yearToDate;
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

  const trailing = TRAILING_MONTHS[period];
  if (trailing) return trailingMonthsRange(trailing, now);

  const { year, month } = civilPartsInTimeZone(now, "Australia/Sydney");

  if (period === "fy") {
    const start = options.fyStartYear ?? currentFyStartYear(now);
    const fy = financialYearRange(start, now);
    return { from: fy.from, to: fy.to };
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
