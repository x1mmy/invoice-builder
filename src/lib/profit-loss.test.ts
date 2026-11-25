import { describe, expect, it } from "vitest";
import {
  buildProfitLossStatement,
  statementPdfFilename,
} from "@/lib/profit-loss";

const now = new Date("2026-11-25T01:00:00.000Z");

describe("buildProfitLossStatement", () => {
  const statement = buildProfitLossStatement({
    period: "3m",
    now,
    invoices: [
      { amount: 400, status: "Paid" },
      { amount: "120.5", status: "Due on receipt" },
    ],
    cashJobs: [{ amount: 80 }],
    expenses: [
      {
        date: "2026-10-02",
        description: "  Supplies  ",
        amount: 40,
        created_at: "2026-10-02T02:00:00.000Z",
      },
      {
        date: "2026-09-15",
        description: "Fuel",
        amount: "12.25",
        created_at: "2026-09-15T01:00:00.000Z",
      },
      {
        date: "2026-10-02",
        description: "Bins",
        amount: 8,
        created_at: "2026-10-02T01:00:00.000Z",
      },
    ],
  });

  it("uses invoiced plus cash jobs minus expenses", () => {
    expect(statement.invoiced).toBe(520.5);
    expect(statement.cashJobs).toBe(80);
    expect(statement.totalIncome).toBe(600.5);
    expect(statement.totalExpenses).toBe(60.25);
    expect(statement.profit).toBe(540.25);
    expect(statement.received).toBe(400);
  });

  it("lists expenses oldest first and trims descriptions", () => {
    expect(statement.expenses.map((row) => row.description)).toEqual([
      "Fuel",
      "Bins",
      "Supplies",
    ]);
  });

  it("labels the trailing range in Sydney dates", () => {
    expect(statement.periodLabel).toBe("Last 3 months");
    expect(statement.rangeLabel).toBe("1 Sep 2026 – 25 Nov 2026");
    expect(statement.from).toBe("2026-09-01");
    expect(statement.to).toBe("2026-11-25");
  });

  it("labels all time without date bounds", () => {
    const all = buildProfitLossStatement({
      period: "all",
      now,
      invoices: [],
      expenses: [],
      cashJobs: [],
    });
    expect(all.periodLabel).toBe("All time");
    expect(all.rangeLabel).toBe("All dates");
    expect(all.from).toBeNull();
    expect(all.profit).toBe(0);
  });

  it("uses the chosen financial year", () => {
    const fy = buildProfitLossStatement({
      period: "fy",
      fyStartYear: 2024,
      now,
      invoices: [],
      expenses: [],
      cashJobs: [],
    });
    expect(fy.periodLabel).toBe("FY 2024–25");
    expect(fy.rangeLabel).toBe("1 Jul 2024 – 30 Jun 2025");
  });
});

describe("statementPdfFilename", () => {
  it("slugs the period label", () => {
    expect(statementPdfFilename({ periodLabel: "FY 2025–26" })).toBe(
      "Radiant-Rooms-Co-Profit-and-loss-FY-2025-26.pdf",
    );
    expect(statementPdfFilename({ periodLabel: "Last 6 months" })).toBe(
      "Radiant-Rooms-Co-Profit-and-loss-Last-6-months.pdf",
    );
  });
});
