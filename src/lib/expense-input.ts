export type ExpenseKind = "operating" | "donation";

export type ExpenseInput = {
  date: string;
  description: string;
  amount: number;
  kind?: ExpenseKind;
  note?: string;
};

export function parseExpenseInput(
  input: ExpenseInput,
):
  | {
      ok: true;
      data: {
        date: string;
        description: string;
        amount: number;
        kind: ExpenseKind;
        note: string;
      };
    }
  | { ok: false; error: string } {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  const note = (input.note ?? "").trim();
  if (!input.date || !input.description.trim() || !(amount > 0)) {
    return { ok: false, error: "Date, description, and amount are required." };
  }
  if (note.length > 240) {
    return { ok: false, error: "The note is too long." };
  }
  return {
    ok: true,
    data: {
      date: input.date,
      description: input.description.trim(),
      amount,
      kind: input.kind === "donation" ? "donation" : "operating",
      note,
    },
  };
}
