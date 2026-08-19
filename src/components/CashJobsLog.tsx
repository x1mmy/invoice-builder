"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import {
  createCashJob,
  deleteCashJob,
  updateCashJob,
} from "@/app/actions/cash-jobs";
import type { CashJobRow } from "@/lib/books";
import { formatDisplayDate, formatMoney } from "@/lib/calc";
import { cashJobAmount, labourAmount } from "@/lib/cash-job-input";
import { australianDateString, sumAmounts } from "@/lib/period";

type Props = {
  rows: CashJobRow[];
};

type ExtraChargeDraft = {
  id: string;
  label: string;
  amount: string;
};

type Draft = {
  date: string;
  details: string;
  breakdown: string;
  hours: string;
  rate: string;
  extraCharges: ExtraChargeDraft[];
};

const fieldClass =
  "min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm";

function newCharge(): ExtraChargeDraft {
  return { id: crypto.randomUUID(), label: "", amount: "" };
}

function emptyDraft(): Draft {
  return {
    date: australianDateString(),
    details: "",
    breakdown: "",
    hours: "",
    rate: "",
    extraCharges: [newCharge()],
  };
}

function draftFromRow(row: CashJobRow): Draft {
  const extras = row.extra_charges ?? [];
  return {
    date: row.date,
    details: row.description,
    breakdown: row.breakdown ?? "",
    hours: row.hours ? String(row.hours) : "",
    rate: row.rate ? String(row.rate) : "",
    extraCharges:
      extras.length > 0
        ? extras.map((charge) => ({
            id: crypto.randomUUID(),
            label: charge.label,
            amount: String(charge.amount),
          }))
        : [newCharge()],
  };
}

function toInput(draft: Draft) {
  return {
    date: draft.date,
    description: draft.details,
    breakdown: draft.breakdown,
    hours: Number(draft.hours),
    rate: Number(draft.rate),
    extraCharges: draft.extraCharges.map((charge) => ({
      label: charge.label,
      amount: Number(charge.amount),
    })),
  };
}

function hoursLabel(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

export function CashJobsLog({ rows }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [add, setAdd] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Draft>(emptyDraft);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3500);
  };

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCashJob(toInput(add));
      if (!result.ok) {
        flash(result.error);
        return;
      }
      setAdd((current) => ({ ...emptyDraft(), date: current.date }));
      flash("Cash job saved.");
      router.refresh();
    });
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    if (editingId == null) return;
    startTransition(async () => {
      const result = await updateCashJob(editingId, toInput(edit));
      if (!result.ok) {
        flash(result.error);
        return;
      }
      setEditingId(null);
      flash("Cash job updated.");
      router.refresh();
    });
  };

  const onRemove = (row: CashJobRow) => {
    if (!window.confirm(`Delete cash job “${row.description}”?`)) return;
    startTransition(async () => {
      const result = await deleteCashJob(row.id);
      if (!result.ok) flash(result.error);
      else {
        flash("Cash job deleted.");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {message ? (
        <p
          className="rounded-md bg-white/80 px-3 py-2 text-sm text-stone-700 shadow-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Add cash job
        </h2>
        <form
          onSubmit={onAdd}
          className="grid gap-3 rounded-xl border border-stone-300/70 bg-white/70 p-4"
        >
          <CashJobFields
            draft={add}
            onChange={setAdd}
            actions={
              <button
                type="submit"
                disabled={pending}
                className="min-h-11 w-full rounded-md bg-[#5f7a64] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 md:w-auto"
              >
                Save
              </button>
            }
          />
        </form>

        <div className="overflow-hidden rounded-xl border border-stone-300/70 bg-white/70">
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-stone-500">
              No cash jobs logged yet.
            </p>
          ) : (
            <ul className="divide-y divide-stone-200/80">
              {rows.map((row) =>
                editingId === row.id ? (
                  <li key={row.id} className="px-4 py-3">
                    <form onSubmit={onSave} className="grid gap-3">
                      <CashJobFields
                        draft={edit}
                        onChange={setEdit}
                        actions={
                          <>
                            <button
                              type="submit"
                              disabled={pending}
                              className="min-h-11 rounded-md bg-[#5f7a64] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => setEditingId(null)}
                              className="min-h-11 rounded-md border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </>
                        }
                      />
                    </form>
                  </li>
                ) : (
                  <li
                    key={row.id}
                    className="grid gap-1 px-4 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-3"
                  >
                    <p className="text-sm text-stone-500">
                      {formatDisplayDate(row.date)}
                    </p>
                    <div className="min-w-0">
                      <p className="font-medium text-stone-800">{row.description}</p>
                      {row.breakdown ? (
                        <p className="mt-0.5 text-sm whitespace-pre-wrap text-stone-500">
                          {row.breakdown}
                        </p>
                      ) : null}
                      {Number(row.hours) > 0 && Number(row.rate) > 0 ? (
                        <p className="mt-0.5 text-sm text-stone-500">
                          {hoursLabel(Number(row.hours))} hours at{" "}
                          {formatMoney(Number(row.rate))}/hr
                        </p>
                      ) : null}
                      {(row.extra_charges ?? []).map((charge, i) => (
                        <p key={`${charge.label}-${i}`} className="mt-0.5 text-sm text-stone-500">
                          {charge.label} · {formatMoney(Number(charge.amount))}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                      <p className="mr-2 font-semibold tabular-nums text-stone-800">
                        {formatMoney(Number(row.amount))}
                      </p>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setEditingId(row.id);
                          setEdit(draftFromRow(row));
                        }}
                        className="min-h-11 rounded-md px-2 text-xs text-stone-500 hover:text-stone-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onRemove(row)}
                        className="min-h-11 rounded-md px-2 text-xs text-stone-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
          <div className="flex items-center justify-between gap-4 border-t border-stone-300/70 bg-[#f4f2ec] px-4 py-2.5 text-sm font-semibold text-stone-800">
            <span>Total cash jobs</span>
            <span className="min-w-0 break-all text-right tabular-nums">
              {formatMoney(sumAmounts(rows))}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function CashJobFields({
  draft,
  onChange,
  actions,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  actions: ReactNode;
}) {
  const labour = labourAmount(Number(draft.hours), Number(draft.rate));
  const extras = draft.extraCharges.map((charge) => ({
    amount: Number(charge.amount),
  }));
  const total = cashJobAmount(Number(draft.hours), Number(draft.rate), extras);
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  const setCharge = (id: string, patch: Partial<ExtraChargeDraft>) => {
    set({
      extraCharges: draft.extraCharges.map((charge) =>
        charge.id === id ? { ...charge, ...patch } : charge,
      ),
    });
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
        <Field label="Date">
          <input
            type="date"
            required
            value={draft.date}
            onChange={(e) => set({ date: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Job details">
          <input
            type="text"
            required
            value={draft.details}
            onChange={(e) => set({ details: e.target.value })}
            placeholder="e.g. Regular clean — Sehrish"
            className={fieldClass}
          />
        </Field>
      </div>
      <Field label="Breakdown">
        <textarea
          value={draft.breakdown}
          onChange={(e) => set({ breakdown: e.target.value })}
          placeholder="e.g. Kitchen, bathrooms, and hallway"
          rows={3}
          className="w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Total hours">
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={draft.hours}
            onChange={(e) => set({ hours: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Rate ($/hr)">
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={draft.rate}
            onChange={(e) => set({ rate: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Labour">
          <p className="flex min-h-11 items-center font-semibold tabular-nums text-stone-800">
            {labour > 0 ? formatMoney(labour) : "—"}
          </p>
        </Field>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-500">Other fees / charges</p>
        {draft.extraCharges.map((charge) => (
          <div
            key={charge.id}
            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto]"
          >
            <input
              type="text"
              value={charge.label}
              onChange={(e) => setCharge(charge.id, { label: e.target.value })}
              placeholder="e.g. Travel"
              className={fieldClass}
              aria-label="Fee description"
            />
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={charge.amount}
              onChange={(e) => setCharge(charge.id, { amount: e.target.value })}
              placeholder="15.00"
              className={fieldClass}
              aria-label="Fee amount"
            />
            <button
              type="button"
              onClick={() =>
                set({
                  extraCharges:
                    draft.extraCharges.length > 1
                      ? draft.extraCharges.filter((row) => row.id !== charge.id)
                      : [newCharge()],
                })
              }
              className="min-h-11 rounded-md px-2 text-xs text-stone-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set({ extraCharges: [...draft.extraCharges, newCharge()] })}
          className="min-h-11 text-sm font-medium text-[#5f7a64] hover:underline"
        >
          Add another fee
        </button>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm font-semibold tabular-nums text-stone-800">
          Total {total > 0 ? formatMoney(total) : "—"}
        </p>
        <div className="flex flex-wrap items-end gap-2">{actions}</div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}
