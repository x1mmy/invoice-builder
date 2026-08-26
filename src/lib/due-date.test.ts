import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InvoicePreview } from "@/components/InvoicePreview";
import { paymentNoteForDueDate } from "@/lib/business";
import { formatDisplayDate } from "@/lib/calc";
import { addDaysToIsoDate, createDefaultInvoice } from "@/lib/defaults";

describe("createDefaultInvoice due date", () => {
  it("defaults due date to seven days after invoice date", () => {
    const invoice = createDefaultInvoice();
    expect(invoice.dueDate).toBe(addDaysToIsoDate(invoice.invoiceDate, 7));
  });
});

describe("addDaysToIsoDate", () => {
  it("adds seven days within the same month", () => {
    expect(addDaysToIsoDate("2026-08-10", 7)).toBe("2026-08-17");
  });

  it("rolls into the next month", () => {
    expect(addDaysToIsoDate("2026-08-26", 7)).toBe("2026-09-02");
  });
});

describe("paymentNoteForDueDate", () => {
  it("keeps upon-receipt wording when due date is empty", () => {
    expect(paymentNoteForDueDate("")).toBe(
      "Payment is due upon receipt. Please use the invoice number as your payment reference. For questions contact us via the email or mobile above.",
    );
  });

  it("names the due date when one is set", () => {
    expect(paymentNoteForDueDate("2026-09-02")).toBe(
      "Payment is due by 2/9/26. Please use the invoice number as your payment reference. For questions contact us via the email or mobile above.",
    );
  });
});

describe("InvoicePreview due date", () => {
  it("shows the due date and updated payment note", () => {
    const invoice = {
      ...createDefaultInvoice(),
      dueDate: "2026-09-02",
    };
    const html = renderToStaticMarkup(
      createElement(InvoicePreview, { invoice }),
    );
    expect(html).toContain("Due Date:");
    expect(html).toContain(formatDisplayDate("2026-09-02"));
    expect(html).toContain("Payment is due by 2/9/26.");
  });

  it("shows an em dash and upon-receipt copy when due date is missing", () => {
    const invoice = {
      ...createDefaultInvoice(),
      dueDate: "",
    };
    const html = renderToStaticMarkup(
      createElement(InvoicePreview, { invoice }),
    );
    expect(html).toContain("Due Date:");
    expect(html).toContain("Payment is due upon receipt.");
  });
});
