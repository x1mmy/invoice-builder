import { describe, expect, it } from "vitest";
import { cashJobAmount, parseCashJobInput } from "@/lib/cash-job-input";

describe("parseCashJobInput", () => {
  it("trims text and derives amount from hours × rate", () => {
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "  Regular clean  ",
        breakdown: "  Hallway and kitchen  ",
        hours: 2,
        rate: 40,
        extraCharges: [],
      }),
    ).toEqual({
      ok: true,
      data: {
        date: "2026-08-19",
        description: "Regular clean",
        breakdown: "Hallway and kitchen",
        hours: 2,
        rate: 40,
        extra_charges: [],
        amount: 80,
      },
    });
  });

  it("adds other fees onto the labour amount", () => {
    expect(
      parseCashJobInput({
        date: "2026-08-17",
        description: "Regular clean",
        breakdown: "",
        hours: 2,
        rate: 40,
        extraCharges: [
          { label: "  Travel  ", amount: 15 },
          { label: "Cleaning supplies", amount: 15 },
          { label: "", amount: 0 },
        ],
      }),
    ).toEqual({
      ok: true,
      data: {
        date: "2026-08-17",
        description: "Regular clean",
        breakdown: "",
        hours: 2,
        rate: 40,
        extra_charges: [
          { label: "Travel", amount: 15 },
          { label: "Cleaning supplies", amount: 15 },
        ],
        amount: 110,
      },
    });
  });

  it("rejects a fee with only a label or only an amount", () => {
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "Regular clean",
        breakdown: "",
        hours: 2,
        rate: 40,
        extraCharges: [{ label: "Travel", amount: 0 }],
      }),
    ).toEqual({
      ok: false,
      error: "Each other fee needs a description and an amount.",
    });
  });

  it("allows a blank breakdown", () => {
    const result = parseCashJobInput({
      date: "2026-08-19",
      description: "Regular clean",
      breakdown: "   ",
      hours: 1.5,
      rate: 40,
      extraCharges: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.breakdown).toBe("");
      expect(result.data.amount).toBe(60);
    }
  });

  it("rejects missing date, details, hours, or rate", () => {
    const error = "Date, job details, hours, and rate are required.";
    expect(
      parseCashJobInput({
        date: "",
        description: "Regular clean",
        breakdown: "",
        hours: 2,
        rate: 40,
        extraCharges: [],
      }),
    ).toEqual({ ok: false, error });
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "   ",
        breakdown: "",
        hours: 2,
        rate: 40,
        extraCharges: [],
      }),
    ).toEqual({ ok: false, error });
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "Regular clean",
        breakdown: "",
        hours: 0,
        rate: 40,
        extraCharges: [],
      }),
    ).toEqual({ ok: false, error });
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "Regular clean",
        breakdown: "",
        hours: 2,
        rate: 0,
        extraCharges: [],
      }),
    ).toEqual({ ok: false, error });
  });
});

describe("cashJobAmount", () => {
  it("sums labour and extra charges", () => {
    expect(cashJobAmount(2, 40, [{ amount: 15 }, { amount: 15 }])).toBe(110);
  });
});
