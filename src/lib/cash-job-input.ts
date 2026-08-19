export type CashJobInput = {
  date: string;
  description: string;
  breakdown: string;
  hours: number;
  rate: number;
};

export type ParsedCashJob = CashJobInput & { amount: number };

export function cashJobAmount(hours: number, rate: number): number {
  const h = Math.round(Number(hours) * 100) / 100;
  const r = Math.round(Number(rate) * 100) / 100;
  if (!(h > 0) || !(r > 0)) return 0;
  return Math.round(h * r * 100) / 100;
}

export function parseCashJobInput(
  input: CashJobInput,
): { ok: true; data: ParsedCashJob } | { ok: false; error: string } {
  const hours = Math.round(Number(input.hours) * 100) / 100;
  const rate = Math.round(Number(input.rate) * 100) / 100;
  const amount = cashJobAmount(hours, rate);

  if (!input.date || !input.description.trim() || amount === 0) {
    return {
      ok: false,
      error: "Date, job details, hours, and rate are required.",
    };
  }

  return {
    ok: true,
    data: {
      date: input.date,
      description: input.description.trim(),
      breakdown: input.breakdown.trim(),
      hours,
      rate,
      amount,
    },
  };
}
