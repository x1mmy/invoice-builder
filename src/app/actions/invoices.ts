"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import type { InvoiceRow } from "@/lib/books";
import { subtotal } from "@/lib/calc";
import { periodRange, type PeriodFilter } from "@/lib/period";
import { getSupabase } from "@/lib/supabase/server";
import type { Invoice, InvoiceStatus } from "@/lib/types";

export async function listInvoices(
  period: PeriodFilter,
  fyStartYear?: number,
): Promise<InvoiceRow[]> {
  await requireAuth();
  const { from, to } = periodRange(period, { fyStartYear });
  let query = getSupabase()
    .from("invoices")
    .select("*")
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("invoice_date", from);
  if (to) query = query.lte("invoice_date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeInvoiceRow);
}

export async function getInvoice(
  id: string,
): Promise<InvoiceRow | null> {
  await requireAuth();
  const { data, error } = await getSupabase()
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeInvoiceRow(data) : null;
}

export async function saveInvoice(
  invoice: Invoice,
  existingId?: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const amount = subtotal(invoice.lineItems);
    const row = {
      invoice_number: invoice.invoiceNumber || "—",
      invoice_date: invoice.invoiceDate || new Date().toISOString().slice(0, 10),
      job_date: invoice.jobDate || invoice.invoiceDate,
      client_name: invoice.client.name.trim() || "—",
      amount,
      status: invoice.status,
      payload: invoice,
    };

    if (existingId) {
      const { data, error } = await getSupabase()
        .from("invoices")
        .update(row)
        .eq("id", existingId)
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      revalidatePath("/");
      revalidatePath(`/invoice/${existingId}`);
      return { ok: true, id: data.id as string };
    }

    const { data, error } = await getSupabase()
      .from("invoices")
      .insert(row)
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true, id: data.id as string };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t save invoice.",
    };
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const { data: existing, error: fetchError } = await getSupabase()
      .from("invoices")
      .select("payload")
      .eq("id", id)
      .single();
    if (fetchError) return { ok: false, error: fetchError.message };

    const payload = {
      ...(existing.payload as Invoice),
      status,
    };

    const { error } = await getSupabase()
      .from("invoices")
      .update({ status, payload })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath(`/invoice/${id}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t update status.",
    };
  }
}

export async function deleteInvoice(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const { error } = await getSupabase().from("invoices").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t delete invoice.",
    };
  }
}

function normalizeInvoiceRow(row: Record<string, unknown>): InvoiceRow {
  return {
    id: String(row.id),
    invoice_number: String(row.invoice_number ?? ""),
    invoice_date: String(row.invoice_date ?? ""),
    job_date: String(row.job_date ?? ""),
    client_name: String(row.client_name ?? ""),
    amount: Number(row.amount ?? 0),
    status: row.status as InvoiceStatus,
    payload: row.payload as Invoice,
    created_at: String(row.created_at ?? ""),
  };
}
