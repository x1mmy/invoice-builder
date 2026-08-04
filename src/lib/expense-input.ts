export function parseExpenseInput(input: {
  date: string;
  description: string;
  amount: number;
}): { ok: true; data: { date: string; description: string; amount: number } } | { ok: false; error: string } {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!input.date || !input.description.trim() || !(amount > 0)) {
    return { ok: false, error: "Date, description, and amount are required." };
  }
  return {
    ok: true,
    data: {
      date: input.date,
      description: input.description.trim(),
      amount,
    },
  };
}
