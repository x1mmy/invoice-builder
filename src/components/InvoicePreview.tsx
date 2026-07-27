import { BUSINESS } from "@/lib/business";
import { Logo } from "@/components/Logo";
import {
  formatDisplayDate,
  formatMoney,
  lineAmount,
  lineDetailsDisplay,
  serviceSummary,
  subtotal,
} from "@/lib/calc";
import type { Invoice } from "@/lib/types";

type Props = {
  invoice: Invoice;
};

export function InvoicePreview({ invoice }: Props) {
  const includedAreas = invoice.areas.filter((a) => a.included && a.label.trim());
  const includedRecs = invoice.recommendations.filter(
    (r) => r.included && r.text.trim(),
  );
  const pricedLines = invoice.lineItems.filter(
    (l) => l.service.trim() || lineAmount(l) > 0,
  );
  const total = subtotal(invoice.lineItems);
  const summary = serviceSummary(invoice.serviceDetails);

  return (
    <article
      id="invoice-preview"
      className="invoice-sheet relative mx-auto w-full max-w-[210mm] overflow-hidden rounded-sm bg-[#f7f5f0] text-stone-800 shadow-lg"
    >
      <div className="invoice-texture pointer-events-none absolute inset-0 opacity-40" />

      <div className="relative px-5 py-5 sm:px-7 sm:py-6">
        {/* Compact header: logo + invoice meta side by side */}
        <header className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <Logo className="h-auto w-[140px] shrink-0 object-contain sm:w-[160px]" />
          <div className="w-full text-center sm:w-auto sm:text-right">
            <p className="font-[family-name:var(--font-display)] text-2xl leading-none text-[#3d5244] sm:text-3xl">
              Invoice
            </p>
            <dl className="mt-1.5 space-y-0.5 text-sm text-stone-600">
              <div className="flex justify-center gap-2 sm:justify-end">
                <dt className="text-stone-500">Invoice No:</dt>
                <dd className="font-medium text-stone-800">
                  {invoice.invoiceNumber || "—"}
                </dd>
              </div>
              <div className="flex justify-center gap-2 sm:justify-end">
                <dt className="text-stone-500">Invoice Date:</dt>
                <dd>{formatDisplayDate(invoice.invoiceDate) || "—"}</dd>
              </div>
              <div className="flex justify-center gap-2 sm:justify-end">
                <dt className="text-stone-500">Job Date:</dt>
                <dd>{formatDisplayDate(invoice.jobDate) || "—"}</dd>
              </div>
              <div className="mt-1 flex items-center justify-center gap-2 sm:justify-end">
                <dt className="text-stone-500">Status:</dt>
                <dd>
                  <span className="inline-block rounded-full bg-[#5f7a64] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                    {invoice.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="mx-auto my-3 flex max-w-full items-center gap-3">
          <span className="h-px flex-1 bg-[#c4a574]" />
          <span className="h-1.5 w-1.5 rotate-45 bg-[#c4a574]" />
          <span className="h-px flex-1 bg-[#c4a574]" />
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-x-6 gap-y-0.5 text-sm text-stone-600">
          <p className="font-semibold text-stone-800">{BUSINESS.legalName}</p>
          <p>ABN: {BUSINESS.abn}</p>
          <p>Email: {BUSINESS.email}</p>
          <p>Mobile: {BUSINESS.mobile}</p>
        </div>

        {/* Billed to + Service details */}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded border border-[#c9bda8] bg-[#efebe3] px-3 py-2.5">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[#5f7a64] uppercase">
              Billed to
            </p>
            <div className="mt-1 text-sm leading-snug">
              <p className="font-semibold text-stone-800">
                {invoice.client.name || "Client name"}
              </p>
              {invoice.client.addressLine1 && (
                <p className="text-stone-600">{invoice.client.addressLine1}</p>
              )}
              {invoice.client.addressLine2 && (
                <p className="text-stone-600">{invoice.client.addressLine2}</p>
              )}
            </div>
          </div>
          <div className="rounded border border-[#c9bda8] bg-[#efebe3] px-3 py-2.5">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[#5f7a64] uppercase">
              Service details
            </p>
            <div className="mt-1 text-sm leading-snug">
              <p>
                <span className="text-stone-500">Service: </span>
                <span className="font-medium">
                  {invoice.serviceDetails.serviceName || "—"}
                </span>
              </p>
              {summary && (
                <p className="text-stone-600">
                  <span className="text-stone-500">Duration: </span>
                  {summary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Areas */}
        {includedAreas.length > 0 && (
          <section className="mt-4">
            <SectionRule title="Areas Serviced" />
            <ul className="mt-2 grid gap-x-6 gap-y-1 text-sm leading-snug sm:grid-cols-2">
              {includedAreas.map((area) => (
                <li key={area.id} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c4a574]" />
                  <span>
                    <span className="font-medium text-stone-800">
                      {area.label}
                    </span>
                    {area.notes && (
                      <span className="text-stone-500"> — {area.notes}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Pricing */}
        <section className="mt-4">
          <SectionRule title="Pricing Table" />
          <div className="mt-2 overflow-hidden rounded border border-[#d4c9b5]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#8a9a7b] text-left text-[10px] font-semibold tracking-wider text-white uppercase">
                  <th className="px-2.5 py-1.5 font-semibold">Description</th>
                  <th className="px-2.5 py-1.5 font-semibold">Details</th>
                  <th className="px-2.5 py-1.5 text-right font-semibold">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricedLines.length === 0 ? (
                  <tr className="bg-white">
                    <td
                      colSpan={3}
                      className="px-2.5 py-2.5 text-center text-stone-400"
                    >
                      Add pricing lines in the form
                    </td>
                  </tr>
                ) : (
                  pricedLines.map((item, i) => (
                    <tr
                      key={item.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-[#f3efe6]"}
                    >
                      <td className="border-t border-[#e8e0d4] px-2.5 py-1.5 font-medium">
                        {item.service || "—"}
                      </td>
                      <td className="border-t border-l border-[#e8e0d4] px-2.5 py-1.5 text-stone-600">
                        {lineDetailsDisplay(item) || "—"}
                      </td>
                      <td className="border-t border-l border-[#e8e0d4] px-2.5 py-1.5 text-right tabular-nums">
                        {formatMoney(lineAmount(item))}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-white">
                  <td
                    colSpan={2}
                    className="border-t border-[#e8e0d4] px-2.5 py-1.5 font-semibold"
                  >
                    Subtotal
                  </td>
                  <td className="border-t border-l border-[#e8e0d4] px-2.5 py-1.5 text-right font-semibold tabular-nums">
                    {formatMoney(total)}
                  </td>
                </tr>
                <tr className="bg-[#5c4a32]">
                  <td
                    colSpan={2}
                    className="px-2.5 py-2 text-[11px] font-bold tracking-wider text-white uppercase"
                  >
                    Total Due
                  </td>
                  <td className="px-2.5 py-2 text-right text-sm font-bold text-white tabular-nums">
                    {formatMoney(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment details */}
        <section className="mt-4">
          <SectionRule title="Payment Details" />
          <div className="mt-2 rounded border border-[#c9bda8] bg-[#efebe3] px-3 py-2 text-sm leading-snug">
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-6">
              <dl className="space-y-0.5">
                <div className="flex gap-2">
                  <dt className="text-stone-500">BSB:</dt>
                  <dd className="font-medium tabular-nums text-stone-800">
                    {BUSINESS.bank.bsb}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-stone-500">Account:</dt>
                  <dd className="font-medium tabular-nums text-stone-800">
                    {BUSINESS.bank.accountNumber}
                  </dd>
                </div>
              </dl>
              <dl className="space-y-0.5">
                <div className="flex gap-2">
                  <dt className="text-stone-500">Account name:</dt>
                  <dd className="font-medium text-stone-800">
                    {BUSINESS.bank.accountName}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-stone-500">Reference:</dt>
                  <dd className="font-semibold text-stone-800">
                    {invoice.invoiceNumber.trim() || "Invoice number"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        {includedRecs.length > 0 && (
          <section className="mt-4">
            <SectionRule title="Recommendations" />
            <ul className="mt-2 space-y-1 text-sm leading-snug text-stone-700">
              {includedRecs.map((rec) => (
                <li key={rec.id} className="flex gap-2">
                  <span className="text-[#c4a574]">✓</span>
                  <span>{rec.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer band */}
        <footer className="mt-5 overflow-hidden rounded-sm">
          <div className="bg-gradient-to-r from-[#5c4a32] via-[#7a6448] to-[#5c4a32] px-3 py-3 text-center text-white">
            <p className="font-[family-name:var(--font-display)] text-xl leading-tight">
              {BUSINESS.footerThanks}
            </p>
            <p className="mt-0.5 text-[11px] text-white/80">
              {BUSINESS.footerNote} · Thank you for your business.
            </p>
          </div>
          <p className="mt-2 text-center text-[10px] leading-snug text-stone-500">
            {BUSINESS.paymentNote}
          </p>
        </footer>
      </div>
    </article>
  );
}

function SectionRule({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-px flex-1 bg-[#c9bda8]" />
      <h3 className="text-[10px] font-semibold tracking-[0.18em] text-[#5f7a64] uppercase">
        {title}
      </h3>
      <span className="h-px flex-1 bg-[#c9bda8]" />
    </div>
  );
}
