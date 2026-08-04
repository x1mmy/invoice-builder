import { describe, expect, it } from "vitest";
import { sumReceived } from "@/lib/books";

describe("sumReceived", () => {
  it("sums only Paid invoices", () => {
    expect(
      sumReceived([
        { amount: 100, status: "Paid" },
        { amount: 50, status: "Due on receipt" },
        { amount: 25.5, status: "Paid" },
      ]),
    ).toBe(125.5);
  });
});
