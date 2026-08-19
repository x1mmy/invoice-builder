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

export function labourAmount(hours: number, rate: number): number {
  const h = Math.round(Number(hours) * 100) / 100;
  const r = Math.round(Number(rate) * 100) / 100;
  if (!(h > 0) || !(r > 0)) return 0;
  return Math.round(h * r * 100) / 100;
}

function extraChargesTotal(charges: { amount: number }[]): number {
  const total = charges.reduce((sum, charge) => sum + Number(charge.amount || 0), 0);
  return Math.round(total * 100) / 100;
}

export function cashJobAmount(
  hours: number,
  rate: number,
  extraCharges: { amount: number }[] = [],
): number {
  return Math.round((labourAmount(hours, rate) + extraChargesTotal(extraCharges)) * 100) / 100;
}

function parseExtraCharges(
  input: { label: string; amount: number }[] | undefined,
): { ok: true; data: CashJobCharge[] } | { ok: false; error: string } {
  const charges: CashJobCharge[] = [];
  for (const row of input ?? []) {
    const label = row.label.trim();
    const amount = Math.round(Number(row.amount) * 100) / 100;
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
  const hours = Math.round(Number(input.hours) * 100) / 100;
  const rate = Math.round(Number(input.rate) * 100) / 100;
  const extras = parseExtraCharges(input.extraCharges);
  if (!extras.ok) return extras;

  const labour = labourAmount(hours, rate);
  const amount = Math.round((labour + extraChargesTotal(extras.data)) * 100) / 100;

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
