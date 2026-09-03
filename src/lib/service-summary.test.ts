import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InvoicePreview } from "@/components/InvoicePreview";
import { serviceSummary } from "@/lib/calc";
import { createDefaultInvoice } from "@/lib/defaults";

function details(
  patch: Partial<ReturnType<typeof createDefaultInvoice>["serviceDetails"]>,
) {
  return { ...createDefaultInvoice().serviceDetails, ...patch };
}

describe("serviceSummary", () => {
  it("omits a time range when start and end are the same", () => {
    const text = serviceSummary(
      details({ startTime: "20:32", endTime: "20:32", breakMinutes: 0 }),
    );
    expect(text).not.toContain("8:32");
    expect(text).toBe("");
  });

  it("shows a range when start and end differ", () => {
    expect(
      serviceSummary(details({ startTime: "09:00", endTime: "17:00" })),
    ).toContain("9:00am – 5:00pm");
  });
});

describe("InvoicePreview duration", () => {
  it("hides Duration when times are cleared", () => {
    const invoice = createDefaultInvoice();
    invoice.serviceDetails = details({
      startTime: "",
      endTime: "",
      hoursPerStaff: "",
      staffCount: "",
      breakMinutes: 0,
    });
    const html = renderToStaticMarkup(
      createElement(InvoicePreview, { invoice }),
    );
    expect(html).not.toContain("Duration:");
  });
});
