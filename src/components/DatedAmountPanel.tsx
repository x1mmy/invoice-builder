"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { formatDisplayDate, formatMoney } from "@/lib/calc";
import { australianDateString } from "@/lib/period";

type Row = {
  id: string;
  date: string;
  description: string;
  amount: number;
};

type ActionResult = { ok: true } | { ok: false; error: string };

type Props = {
  addTitle: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  emptyText: string;
  totalLabel: string;
  total: number;
  rows: Row[];
  flash: (text: string) => void;
  messages: {
    saved: string;
    updated: string;
    deleted: string;
    confirmDelete: (description: string) => string;
  };
  onCreate: (input: {
    date: string;
    description: string;
    amount: number;
  }) => Promise<ActionResult>;
  onUpdate: (
    id: string,
    input: { date: string; description: string; amount: number },
  ) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
};

export function DatedAmountPanel({
  addTitle,
  detailsLabel,
  detailsPlaceholder,
  emptyText,
  totalLabel,
  total,
  rows,
  flash,
  messages,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState(() => australianDateString());
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await onCreate({
        date,
        description: details,
        amount: Number(amount),
      });
      if (!result.ok) {
        flash(result.error);
        return;
      }
      setDetails("");
      setAmount("");
      flash(messages.saved);
      router.refresh();
    });
  };

  const startEdit = (row: Row) => {
    setEditingId(row.id);
    setEditDate(row.date);
    setEditDetails(row.description);
    setEditAmount(String(row.amount));
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    if (editingId == null) return;
    const savedDate = editDate;
    const savedDetails = editDetails;
    const savedAmount = editAmount;
    startTransition(async () => {
      const result = await onUpdate(editingId, {
        date: savedDate,
        description: savedDetails,
        amount: Number(savedAmount),
      });
      if (!result.ok) {
        flash(result.error);
        setEditDate(savedDate);
        setEditDetails(savedDetails);
        setEditAmount(savedAmount);
        return;
      }
      setEditingId(null);
      flash(messages.updated);
      router.refresh();
    });
  };

  const onRemove = (row: Row) => {
    if (!window.confirm(messages.confirmDelete(row.description))) return;
    startTransition(async () => {
      const result = await onDelete(row.id);
      if (!result.ok) flash(result.error);
      else {
        flash(messages.deleted);
        router.refresh();
      }
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        {addTitle}
      </h2>
      <form
        onSubmit={onAdd}
        className="grid gap-3 rounded-xl border border-stone-300/70 bg-white/70 p-4 md:grid-cols-[1fr_2fr_1fr_auto]"
      >
        <DateField value={date} onChange={setDate} />
        <DetailsField
          label={detailsLabel}
          value={details}
          onChange={setDetails}
          placeholder={detailsPlaceholder}
        />
        <AmountField value={amount} onChange={setAmount} />
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 w-full rounded-md bg-[#5f7a64] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 md:w-auto"
          >
            Save
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <SheetWithTotal label={totalLabel} value={total}>
          <EmptyState text={emptyText} />
        </SheetWithTotal>
      ) : (
        <SheetWithTotal label={totalLabel} value={total}>
          <ul className="divide-y divide-stone-200/80">
            {rows.map((row) =>
              editingId === row.id ? (
                <li key={row.id} className="px-4 py-3">
                  <form
                    onSubmit={onSave}
                    className="grid gap-3 md:grid-cols-[1fr_2fr_1fr_auto_auto]"
                  >
                    <DateField value={editDate} onChange={setEditDate} />
                    <DetailsField
                      label={detailsLabel}
                      value={editDetails}
                      onChange={setEditDetails}
                    />
                    <AmountField value={editAmount} onChange={setEditAmount} />
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={pending}
                        className="min-h-11 w-full rounded-md bg-[#5f7a64] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 md:w-auto"
                      >
                        Save
                      </button>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setEditingId(null)}
                        className="min-h-11 w-full rounded-md border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-60 md:w-auto"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </li>
              ) : (
                <li
                  key={row.id}
                  className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)_5.5rem_auto] sm:items-center sm:gap-3"
                >
                  <p className="text-sm text-stone-500">
                    {formatDisplayDate(row.date)}
                  </p>
                  <p className="min-w-0 break-words font-medium text-stone-800">
                    {row.description}
                  </p>
                  <p className="break-all font-semibold tabular-nums text-stone-800 sm:text-right">
                    {formatMoney(Number(row.amount))}
                  </p>
                  <div className="flex flex-wrap gap-1 sm:justify-end">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startEdit(row)}
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
        </SheetWithTotal>
      )}
    </section>
  );
}

function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-xs font-medium text-stone-500">Date</span>
      <input
        type="date"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
      />
    </label>
  );
}

function DetailsField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-xs font-medium text-stone-500">{label}</span>
      <input
        type="text"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
      />
    </label>
  );
}

function AmountField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-xs font-medium text-stone-500">Amount</span>
      <input
        type="number"
        required
        min="0.01"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
      />
    </label>
  );
}

export function SheetWithTotal({
  label,
  value,
  children,
}: {
  label: string;
  value: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-300/70 bg-white/70">
      {children}
      <div className="flex items-center justify-between gap-4 border-t border-stone-300/70 bg-[#f4f2ec] px-4 py-2.5 text-sm font-semibold text-stone-800">
        <span>{label}</span>
        <span className="min-w-0 break-all text-right tabular-nums">
          {formatMoney(value)}
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <p className="px-4 py-10 text-center text-sm text-stone-500">{text}</p>
  );
}
