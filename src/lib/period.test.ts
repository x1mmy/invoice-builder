import { describe, expect, it } from "vitest";
import {
  currentFyStartYear,
  fyLabel,
  periodRange,
} from "@/lib/period";

describe("currentFyStartYear", () => {
  it("returns same calendar year on or after 1 July", () => {
    expect(currentFyStartYear(new Date(2026, 6, 1))).toBe(2026); // Jul 1
    expect(currentFyStartYear(new Date(2026, 11, 31))).toBe(2026);
  });

  it("returns previous calendar year before 1 July", () => {
    expect(currentFyStartYear(new Date(2026, 5, 30))).toBe(2025); // Jun 30
    expect(currentFyStartYear(new Date(2026, 0, 1))).toBe(2025);
  });
});

describe("fyLabel", () => {
  it("formats FY with en-dash", () => {
    expect(fyLabel(2025)).toBe("FY 2025–26");
    expect(fyLabel(1999)).toBe("FY 1999–00");
  });
});

describe("periodRange fy", () => {
  it("uses current FY when fyStartYear omitted", () => {
    const range = periodRange("fy", { now: new Date(2026, 7, 4) }); // Aug 4 2026
    expect(range).toEqual({ from: "2026-07-01", to: "2027-06-30" });
  });

  it("honours explicit fyStartYear", () => {
    const range = periodRange("fy", {
      now: new Date(2026, 7, 4),
      fyStartYear: 2024,
    });
    expect(range).toEqual({ from: "2024-07-01", to: "2025-06-30" });
  });

  it("keeps month/year/all behaviour", () => {
    expect(periodRange("month", { now: new Date(2026, 7, 4) })).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(periodRange("year", { now: new Date(2026, 7, 4) })).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
    expect(periodRange("all")).toEqual({ from: null, to: null });
  });
});
