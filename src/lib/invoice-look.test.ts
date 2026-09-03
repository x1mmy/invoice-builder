import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InvoicePreview } from "@/components/InvoicePreview";
import { BUSINESS } from "@/lib/business";
import { createDefaultInvoice, normalizeInvoice } from "@/lib/defaults";
import { invoiceLook } from "@/lib/invoice-look";
import type { Invoice } from "@/lib/types";

describe("invoiceLook", () => {
  it("keeps the cleaning look when the logo is on", () => {
    const look = invoiceLook(true);
    expect(look.totalBarClass).toContain("#5c4a32");
    expect(look.footerHeadline).toBe(BUSINESS.footerThanks);
    expect(look.footerNote).toContain(BUSINESS.footerNote);
  });

  it("uses gold bars and a short thank-you when the logo is off", () => {
    const look = invoiceLook(false);
    expect(look.totalBarClass).toContain("#c4a574");
    expect(look.footerHeadline).toBe("Thank you for your business");
    expect(look.footerNote).toBeNull();
  });

  it("treats a missing flag as the cleaning look", () => {
    expect(invoiceLook(undefined).totalBarClass).toContain("#5c4a32");
  });
});

describe("normalizeInvoice", () => {
  it("defaults missing showLogo to true", () => {
    const { showLogo: _omit, ...rest } = createDefaultInvoice();
    expect(normalizeInvoice(rest as Invoice).showLogo).toBe(true);
  });

  it("keeps an explicit false", () => {
    expect(
      normalizeInvoice({ ...createDefaultInvoice(), showLogo: false }).showLogo,
    ).toBe(false);
  });
});

describe("InvoicePreview logo look", () => {
  it("includes the logo and cleaning thank-you by default", () => {
    const html = renderToStaticMarkup(
      createElement(InvoicePreview, { invoice: createDefaultInvoice() }),
    );
    expect(html).toContain(BUSINESS.logoSrc);
    expect(html).toContain(BUSINESS.footerThanks);
    expect(html).toContain("#5c4a32");
  });

  it("hides the logo and uses the short thank-you when showLogo is false", () => {
    const html = renderToStaticMarkup(
      createElement(InvoicePreview, {
        invoice: { ...createDefaultInvoice(), showLogo: false },
      }),
    );
    expect(html).not.toContain(BUSINESS.logoSrc);
    expect(html).not.toContain(BUSINESS.footerThanks);
    expect(html).toContain("Thank you for your business");
    expect(html).toContain("#c4a574");
  });
});
