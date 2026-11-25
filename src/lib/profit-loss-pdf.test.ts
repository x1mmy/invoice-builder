import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import { buildProfitLossStatement } from "@/lib/profit-loss";
import { renderStatementPdf } from "@/lib/profit-loss-pdf";

function render(statement: ReturnType<typeof buildProfitLossStatement>) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: false,
  });
  renderStatementPdf(pdf, statement);
  return pdf;
}

describe("renderStatementPdf", () => {
  it("fits an empty period on one page", () => {
    const pdf = render(
      buildProfitLossStatement({
        period: "month",
        now: new Date("2026-11-25T01:00:00.000Z"),
        invoices: [{ amount: 200, status: "Paid" }],
        expenses: [],
        cashJobs: [{ amount: 40 }],
      }),
    );
    expect(pdf.getNumberOfPages()).toBe(1);
    const raw = Buffer.from(pdf.output("arraybuffer")).toString("latin1");
    expect(raw).toContain("Profit & loss");
    expect(raw).toContain("No expenses in this period.");
    expect(raw).toContain("ABN 89 766 007 046");
  });

  it("starts a new page between expense rows instead of splitting one", () => {
    const expenses = Array.from({ length: 48 }, (_, index) => ({
      date: `2026-06-${String((index % 28) + 1).padStart(2, "0")}`,
      description:
        index % 7 === 0
          ? "Long supply run for the care home, including cloths, solution, and spare gloves for the team"
          : `Expense ${index + 1}`,
      amount: 10 + index,
      created_at: `2026-06-01T00:00:${String(index).padStart(2, "0")}Z`,
    }));
    const pdf = render(
      buildProfitLossStatement({
        period: "6m",
        now: new Date("2026-11-25T01:00:00.000Z"),
        invoices: [{ amount: 1000, status: "Due on receipt" }],
        expenses,
        cashJobs: [],
      }),
    );
    expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
    const raw = Buffer.from(pdf.output("arraybuffer")).toString("latin1");
    expect(raw).toContain("Total expenses");
    expect(raw).toContain("Received");
  });
});
