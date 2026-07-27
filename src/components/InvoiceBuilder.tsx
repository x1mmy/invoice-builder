"use client";

import { useEffect, useState } from "react";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoicePreview } from "@/components/InvoicePreview";
import { BUSINESS } from "@/lib/business";
import { createDefaultInvoice } from "@/lib/defaults";
import { clearDraft, loadDraft, saveDraft } from "@/lib/storage";
import type { Invoice } from "@/lib/types";

export function InvoiceBuilder() {
  const [invoice, setInvoice] = useState<Invoice>(createDefaultInvoice);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    // Hydrate from localStorage after mount (SSR-safe).
    /* eslint-disable react-hooks/set-state-in-effect -- client-only draft hydrate */
    if (draft) setInvoice(draft);
    setHasHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    saveDraft(invoice);
  }, [invoice, hasHydrated]);

  const handleNew = () => {
    if (!window.confirm("Clear this invoice and start a new one?")) {
      return;
    }
    clearDraft();
    setInvoice(createDefaultInvoice());
  };

  return (
    <div className="min-h-screen bg-[#e8ebe4]">
      <header className="no-print sticky top-0 z-20 border-b border-stone-300/60 bg-[#e8ebe4]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl text-[#3d5244]">
              {BUSINESS.name}
            </p>
            <p className="text-xs text-stone-500">Invoice builder</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNew}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              New invoice
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-[#5f7a64] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4e6754]"
            >
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(320px,420px)_1fr] lg:items-start">
        <aside className="no-print rounded-lg border border-stone-300/70 bg-[#f4f2ec] p-4 shadow-sm sm:p-5">
          <InvoiceForm invoice={invoice} onChange={setInvoice} />
        </aside>

        <div className="print-area min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="no-print mb-3 flex items-center justify-between lg:hidden">
            <p className="text-sm font-medium text-stone-600">Preview</p>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-[#5f7a64] px-3 py-1.5 text-sm font-semibold text-white"
            >
              Download PDF
            </button>
          </div>
          <InvoicePreview invoice={invoice} />
        </div>
      </main>
    </div>
  );
}
