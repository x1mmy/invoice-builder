import { describe, expect, it } from "vitest";
import { stillToReceive, sumReceived, unpaidInvoices } from "@/lib/books";

const sample = [
  { amount: 100, status: "Paid" },
  { amount: 50, status: "Due on receipt" },
  { amount: 25.5, status: "Paid" },
  { amount: 1059, status: "Overdue" },
];

describe("sumReceived", () => {
  it("sums only Paid invoices", () => {
    expect(sumReceived(sample)).toBe(125.5);
  });
});

describe("still to receive", () => {
  it("is invoiced minus received", () => {
    expect(stillToReceive(1289.98, 230.98)).toBe(1059);
  });

  it("counts every invoice that is not Paid", () => {
    expect(unpaidInvoices(sample).map((row) => row.amount)).toEqual([50, 1059]);
  });
});
