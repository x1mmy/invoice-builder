import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InvoicePreview } from "@/components/InvoicePreview";
import { BUSINESS, paymentNoteForDueDate } from "@/lib/business";
import { createDefaultInvoice, unpaidStatusAfterPaid } from "@/lib/defaults";

describe("createDefaultInvoice due date", () => {
  it("starts with Due on receipt and no due date", () => {
    const invoice = createDefaultInvoice();
    expect(invoice.status).toBe("Due on receipt");
    expect(invoice.dueDate).toBe("");
  });
});

describe("paymentNoteForDueDate", () => {
  it("keeps upon-receipt wording unless status is Due by with a date", () => {
    expect(paymentNoteForDueDate("Due on receipt", "2026-09-02")).toBe(
      BUSINESS.paymentNote,
    );
    expect(paymentNoteForDueDate("Due by", "")).toBe(BUSINESS.paymentNote);
  });

  it("names the due date when status is Due by", () => {
    expect(paymentNoteForDueDate("Due by", "2026-09-02")).toBe(
      "Payment is due by 2/9/26. Please use the invoice number as your payment reference. For questions contact us via the email or mobile above.",
    );
  });
});

describe("unpaidStatusAfterPaid", () => {
  it("restores Due by when a due date is set", () => {
    expect(
      unpaidStatusAfterPaid({ ...createDefaultInvoice(), dueDate: "2026-09-02" }),
    ).toBe("Due by");
  });

  it("restores Due on receipt when there is no due date", () => {
    expect(unpaidStatusAfterPaid(createDefaultInvoice())).toBe("Due on receipt");
  });
});

describe("InvoicePreview due date", () => {
  it("does not show a due date for Due on receipt", () => {
    const invoice = {
      ...createDefaultInvoice(),
      dueDate: "2026-09-02",
      status: "Due on receipt" as const,
    };
    const html = renderToStaticMarkup(
      createElement(InvoicePreview, { invoice }),
    );
    expect(html).not.toContain("Due Date:");
    expect(html).toContain("Due on receipt");
    expect(html).toContain("Payment is due upon receipt.");
  });

  it("shows the due date only for Due by", () => {
    const invoice = {
      ...createDefaultInvoice(),
      dueDate: "2026-09-02",
      status: "Due by" as const,
    };
    const html = renderToStaticMarkup(
      createElement(InvoicePreview, { invoice }),
    );
    expect(html).toContain("Due Date:");
    expect(html).toContain("2/9/26");
    expect(html).toContain("Due by");
    expect(html).toContain("Payment is due by 2/9/26.");
  });
});
