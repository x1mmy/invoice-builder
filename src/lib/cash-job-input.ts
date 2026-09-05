export type CashJobCharge = {
  label: string;
  amount: number;
};

export type CashJobInput = {
  date: string;
  description: string;
  breakdown: string;
  hours: number;
  rate: number;
  extraCharges: CashJobCharge[];
};

export type ParsedCashJob = {
  date: string;
  description: string;
  breakdown: string;
  hours: number;
  rate: number;
  extra_charges: CashJobCharge[];
  amount: number;
};

function cents(n: number): number {
  return Math.round(Number(n) * 100);
}

function fromCents(n: number): number {
  return n / 100;
}

export function labourAmount(hours: number, rate: number): number {
  const h = cents(hours);
  const r = cents(rate);
  if (!(h > 0) || !(r > 0)) return 0;
  return fromCents(Math.round((h * r) / 100));
}

function extraChargesTotal(charges: { amount: number }[]): number {
  return fromCents(charges.reduce((sum, charge) => sum + cents(charge.amount || 0), 0));
}

export function cashJobAmount(
  hours: number,
  rate: number,
  extraCharges: { amount: number }[] = [],
): number {
  return fromCents(cents(labourAmount(hours, rate) + extraChargesTotal(extraCharges)));
}

function parseExtraCharges(
  input: { label: string; amount: number }[] | undefined,
): { ok: true; data: CashJobCharge[] } | { ok: false; error: string } {
  const charges: CashJobCharge[] = [];
  for (const row of input ?? []) {
    const label = row.label.trim();
    const amount = fromCents(cents(row.amount));
    if (!label && !(amount > 0)) continue;
    if (!label || !(amount > 0)) {
      return {
        ok: false,
        error: "Each other fee needs a description and an amount.",
      };
    }
    charges.push({ label, amount });
  }
  return { ok: true, data: charges };
}

export function parseCashJobInput(
  input: CashJobInput,
): { ok: true; data: ParsedCashJob } | { ok: false; error: string } {
  const hours = fromCents(cents(input.hours));
  const rate = fromCents(cents(input.rate));
  const extras = parseExtraCharges(input.extraCharges);
  if (!extras.ok) return extras;

  const labour = labourAmount(hours, rate);
  const amount = cashJobAmount(hours, rate, extras.data);

  if (!input.date || !input.description.trim() || labour === 0) {
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
      extra_charges: extras.data,
      amount,
    },
  };
}
