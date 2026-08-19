"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import type { CashJobRow } from "@/lib/books";
import { parseCashJobInput, type CashJobInput } from "@/lib/cash-job-input";
import { periodRange, type PeriodFilter } from "@/lib/period";
import { getSupabase } from "@/lib/supabase/server";

export async function listCashJobs(
  period: PeriodFilter,
  fyStartYear?: number,
): Promise<CashJobRow[]> {
  await requireAuth();
  const { from, to } = periodRange(period, { fyStartYear });
  let query = getSupabase()
    .from("cash_jobs")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeCashJobRow(row as CashJobRow));
}

function normalizeCashJobRow(row: CashJobRow): CashJobRow {
  return {
    ...row,
    extra_charges: Array.isArray(row.extra_charges) ? row.extra_charges : [],
  };
}

export async function createCashJob(
  input: CashJobInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const parsed = parseCashJobInput(input);
    if (!parsed.ok) return parsed;

    const { error } = await getSupabase().from("cash_jobs").insert(parsed.data);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/cash-jobs");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t save cash job.",
    };
  }
}

export async function updateCashJob(
  id: string,
  input: CashJobInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const parsed = parseCashJobInput(input);
    if (!parsed.ok) return parsed;

    const { error } = await getSupabase()
      .from("cash_jobs")
      .update(parsed.data)
      .eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/cash-jobs");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t update cash job.",
    };
  }
}

export async function deleteCashJob(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const { error } = await getSupabase().from("cash_jobs").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/cash-jobs");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t delete cash job.",
    };
  }
}
