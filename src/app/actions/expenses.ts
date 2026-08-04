"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import type { ExpenseRow } from "@/lib/books";
import { periodRange, type PeriodFilter } from "@/lib/period";
import { getSupabase } from "@/lib/supabase/server";

export async function listExpenses(
  period: PeriodFilter,
  fyStartYear?: number,
): Promise<ExpenseRow[]> {
  await requireAuth();
  const { from, to } = periodRange(period, { fyStartYear });
  let query = getSupabase()
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ExpenseRow[];
}

export async function createExpense(input: {
  date: string;
  description: string;
  amount: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const amount = Math.round(Number(input.amount) * 100) / 100;
    if (!input.date || !input.description.trim() || !(amount > 0)) {
      return { ok: false, error: "Date, description, and amount are required." };
    }

    const { error } = await getSupabase().from("expenses").insert({
      date: input.date,
      description: input.description.trim(),
      amount,
    });

    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t save expense.",
    };
  }
}

export async function deleteExpense(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAuth();
    const { error } = await getSupabase().from("expenses").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn’t delete expense.",
    };
  }
}
