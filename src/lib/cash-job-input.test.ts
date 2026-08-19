import { describe, expect, it } from "vitest";
import { parseCashJobInput } from "@/lib/cash-job-input";

describe("parseCashJobInput", () => {
  it("trims text and derives amount from hours × rate", () => {
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "  Regular clean  ",
        breakdown: "  Hallway and kitchen  ",
        hours: 2,
        rate: 40,
      }),
    ).toEqual({
      ok: true,
      data: {
        date: "2026-08-19",
        description: "Regular clean",
        breakdown: "Hallway and kitchen",
        hours: 2,
        rate: 40,
        amount: 80,
      },
    });
  });

  it("allows a blank breakdown", () => {
    const result = parseCashJobInput({
      date: "2026-08-19",
      description: "Regular clean",
      breakdown: "   ",
      hours: 1.5,
      rate: 40,
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
      }),
    ).toEqual({ ok: false, error });
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "   ",
        breakdown: "",
        hours: 2,
        rate: 40,
      }),
    ).toEqual({ ok: false, error });
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "Regular clean",
        breakdown: "",
        hours: 0,
        rate: 40,
      }),
    ).toEqual({ ok: false, error });
    expect(
      parseCashJobInput({
        date: "2026-08-19",
        description: "Regular clean",
        breakdown: "",
        hours: 2,
        rate: 0,
      }),
    ).toEqual({ ok: false, error });
  });
});
