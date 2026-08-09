"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteInvoice, saveInvoice } from "@/app/actions/invoices";
import { AppNav } from "@/components/AppNav";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoicePreview } from "@/components/InvoicePreview";
import { createDefaultInvoice } from "@/lib/defaults";
import { downloadInvoicePdf } from "@/lib/downloadPdf";
import { clearDraft, loadDraft, saveDraft } from "@/lib/storage";
import type { Invoice } from "@/lib/types";

type Props = {
  invoiceId?: string;
  initialInvoice?: Invoice;
};

type Toast = {
  message: string;
  detail?: string;
  tone: "ok" | "error";
};

function technicalMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === "string" && err.trim()) return err.trim();
  return "Unknown error";
}

export function InvoiceBuilder({ invoiceId, initialInvoice }: Props) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice>(
    () => initialInvoice ?? createDefaultInvoice(),
  );
  const [hasHydrated, setHasHydrated] = useState(Boolean(initialInvoice));
  const [savingPdf, setSavingPdf] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(invoiceId);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialInvoice) return;
    const draft = loadDraft();
    /* eslint-disable react-hooks/set-state-in-effect -- client-only draft hydrate */
    if (draft) setInvoice(draft);
    setHasHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialInvoice]);

  useEffect(() => {
    if (!hasHydrated || initialInvoice) return;
    saveDraft(invoice);
  }, [invoice, hasHydrated, initialInvoice]);

  useEffect(() => {
    if (!toast) return;
    const ms = toast.tone === "error" ? 10000 : 4000;
    const id = window.setTimeout(() => setToast(null), ms);
    return () => window.clearTimeout(id);
  }, [toast]);

  const flash = (
    message: string,
    options?: { detail?: string; tone?: Toast["tone"] },
  ) => {
    setToast({
      message,
      detail: options?.detail,
      tone: options?.tone ?? "ok",
    });
  };

  const handleNew = () => {
    if (!window.confirm("Clear this invoice and start a new one?")) return;
    clearDraft();
    setSavedId(undefined);
    setInvoice(createDefaultInvoice());
    router.push("/invoice/new");
  };

  const handleDownloadPdf = async () => {
    if (savingPdf) return;
    setSavingPdf(true);
    try {
      await downloadInvoicePdf(invoice.invoiceNumber);
    } catch (err) {
      console.error(err);
      flash("Couldn’t download the PDF. Please try again.", {
        detail: technicalMessage(err),
        tone: "error",
      });
    } finally {
      setSavingPdf(false);
    }
  };

  const handleSaveToBooks = () => {
    startTransition(async () => {
      const result = await saveInvoice(invoice, savedId);
      if (!result.ok) {
        flash(result.error, { tone: "error" });
        return;
      }
      setSavedId(result.id);
      clearDraft();
      flash("Saved to Books.");
      if (!savedId) {
        router.replace(`/invoice/${result.id}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    if (!savedId) return;
    if (!window.confirm("Remove this invoice from Books?")) return;
    startTransition(async () => {
      const result = await deleteInvoice(savedId);
      if (!result.ok) {
        flash(result.error, { tone: "error" });
        return;
      }
      clearDraft();
      router.push("/");
    });
  };

  return (
    <div className="min-h-screen bg-[#e8ebe4]">
      <AppNav />

      <div className="no-print border-b border-stone-300/50 bg-[#e8ebe4]/60">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
          <p className="text-sm text-stone-500">
            {savedId ? (
              <>
                Editing saved invoice ·{" "}
                <Link href="/" className="underline-offset-2 hover:underline">
                  Back to Books
                </Link>
              </>
            ) : (
              "New invoice"
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleNew}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              New invoice
            </button>
            {savedId ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSaveToBooks}
              disabled={pending}
              className="rounded-md border border-[#5f7a64] bg-white px-3 py-2 text-sm font-semibold text-[#3f5544] hover:bg-[#5f7a64]/10 disabled:opacity-60"
            >
              {pending ? "Saving…" : savedId ? "Update Books" : "Save to Books"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={savingPdf}
              className="rounded-md bg-[#5f7a64] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#4e6754] disabled:opacity-60"
            >
              {savingPdf ? "Saving…" : "Download PDF"}
            </button>
          </div>
        </div>
      </div>

      {toast ? (
        <div
          className={`no-print mx-auto max-w-[1600px] px-4 pt-3 sm:px-6 ${
            toast.tone === "error" ? "text-red-800" : "text-stone-700"
          }`}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          <p className="text-sm font-medium">{toast.message}</p>
          {toast.detail ? (
            <p className="mt-1 font-mono text-xs break-words text-stone-500">
              {toast.detail}
            </p>
          ) : null}
        </div>
      ) : null}

      <main className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(320px,420px)_1fr] lg:items-start">
        <aside className="no-print rounded-lg border border-stone-300/70 bg-[#f4f2ec] p-4 shadow-sm sm:p-5">
          <InvoiceForm invoice={invoice} onChange={setInvoice} />
        </aside>

        <div className="print-area min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <div className="no-print mb-3 flex items-center justify-between gap-2 lg:hidden">
            <p className="text-sm font-medium text-stone-600">Preview</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveToBooks}
                disabled={pending}
                className="rounded-md border border-[#5f7a64] bg-white px-3 py-1.5 text-sm font-semibold text-[#3f5544] disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={savingPdf}
                className="rounded-md bg-[#5f7a64] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingPdf ? "Saving…" : "PDF"}
              </button>
            </div>
          </div>
          <InvoicePreview invoice={invoice} />
        </div>
      </main>
    </div>
  );
}
