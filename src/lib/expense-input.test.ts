import { describe, expect, it } from "vitest";
import { parseExpenseInput } from "@/lib/expense-input";

describe("parseExpenseInput", () => {
  it("accepts valid input and trims description", () => {
    const result = parseExpenseInput({
      date: "2026-08-04",
      description: "  Supplies  ",
      amount: 12.345,
    });
    expect(result).toEqual({
      ok: true,
      data: {
        date: "2026-08-04",
        description: "Supplies",
        amount: 12.35,
      },
    });
  });

  it("rejects missing date", () => {
    const result = parseExpenseInput({
      date: "",
      description: "Supplies",
      amount: 10,
    });
    expect(result).toEqual({
      ok: false,
      error: "Date, description, and amount are required.",
    });
  });

  it("rejects blank description", () => {
    const result = parseExpenseInput({
      date: "2026-08-04",
      description: "   ",
      amount: 10,
    });
    expect(result).toEqual({
      ok: false,
      error: "Date, description, and amount are required.",
    });
  });

  it("rejects zero or negative amount", () => {
    expect(
      parseExpenseInput({
        date: "2026-08-04",
        description: "Supplies",
        amount: 0,
      }),
    ).toEqual({
      ok: false,
      error: "Date, description, and amount are required.",
    });
    expect(
      parseExpenseInput({
        date: "2026-08-04",
        description: "Supplies",
        amount: -5,
      }),
    ).toEqual({
      ok: false,
      error: "Date, description, and amount are required.",
    });
  });
});
