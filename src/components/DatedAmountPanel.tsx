"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { formatDisplayDate, formatMoney } from "@/lib/calc";
import { expenseKind, type ExpenseKind } from "@/lib/expense-input";
import { australianDateString } from "@/lib/period";

type Row = {
  id: string;
  date: string;
  description: string;
  amount: number;
  kind?: ExpenseKind;
  note?: string;
};

const PRESETS: {
  label: string;
  kind: ExpenseKind;
  description: string;
  amount: string;
  note: string;
}[] = [
  {
    label: "ALDI Mobile, $23",
    kind: "operating",
    description: "ALDI Mobile",
    amount: "23",
    note: "Prepaid recharge. The ALDI Mobile history is the record.",
  },
  {
    label: "Donation",
    kind: "donation",
    description: "",
    amount: "",
    note: "",
  },
  {
    label: "Electricity and heating",
    kind: "operating",
    description: "Electricity and heating",
    amount: "",
    note: "Working from home. Confirm the amount with the accountant before relying on it.",
  },
];

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
    kind: ExpenseKind;
    note: string;
  }) => Promise<ActionResult>;
  onUpdate: (
    id: string,
    input: {
      date: string;
      description: string;
      amount: number;
      kind: ExpenseKind;
      note: string;
    },
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
  const [kind, setKind] = useState<ExpenseKind>("operating");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editKind, setEditKind] = useState<ExpenseKind>("operating");
  const [editNote, setEditNote] = useState("");

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await onCreate({
        date,
        description: details,
        amount: Number(amount),
        kind,
        note,
      });
      if (!result.ok) {
        flash(result.error);
        return;
      }
      setDetails("");
      setAmount("");
      setKind("operating");
      setNote("");
      flash(messages.saved);
      router.refresh();
    });
  };

  const startEdit = (row: Row) => {
    setEditingId(row.id);
    setEditDate(row.date);
    setEditDetails(row.description);
    setEditAmount(String(row.amount));
    setEditKind(expenseKind(row.kind));
    setEditNote(row.note ?? "");
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
        kind: editKind,
        note: editNote,
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
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setKind(preset.kind);
              setDetails(preset.description);
              setAmount(preset.amount);
              setNote(preset.note);
            }}
            className="min-h-11 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-stone-500">
        These fill the form. Set the date of the payment, then save. Add ALDI
        Mobile once for each recharge.
      </p>
      <form
        onSubmit={onAdd}
        className="grid gap-3 rounded-xl border border-stone-300/70 bg-white/70 p-4"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <DateField value={date} onChange={setDate} />
          <KindField value={kind} onChange={setKind} />
          <AmountField value={amount} onChange={setAmount} />
        </div>
        <DetailsField
          label={detailsLabel}
          value={details}
          onChange={setDetails}
          placeholder={
            kind === "donation" ? "Who it was paid to" : detailsPlaceholder
          }
        />
        <NoteField value={note} onChange={setNote} />
        <div>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-md bg-[#5f7a64] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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
                  <form onSubmit={onSave} className="grid gap-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <DateField value={editDate} onChange={setEditDate} />
                      <KindField value={editKind} onChange={setEditKind} />
                      <AmountField value={editAmount} onChange={setEditAmount} />
                    </div>
                    <DetailsField
                      label={detailsLabel}
                      value={editDetails}
                      onChange={setEditDetails}
                    />
                    <NoteField value={editNote} onChange={setEditNote} />
                    <div className="flex flex-wrap gap-2">
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
                  <div className="min-w-0">
                    <p className="break-words font-medium text-stone-800">
                      {row.description}
                      {row.kind === "donation" ? (
                        <span className="ml-2 text-xs font-semibold text-[#5f7a64]">
                          Donation
                        </span>
                      ) : null}
                    </p>
                    {row.note ? (
                      <p className="mt-0.5 break-words text-xs leading-5 text-stone-500">
                        {row.note}
                      </p>
                    ) : null}
                  </div>
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

function KindField({
  value,
  onChange,
}: {
  value: ExpenseKind;
  onChange: (value: ExpenseKind) => void;
}) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-xs font-medium text-stone-500">Type</span>
      <select
        value={value}
        onChange={(e) => onChange(expenseKind(e.target.value))}
        className="min-h-11 w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm"
      >
        <option value="operating">Operating expense</option>
        <option value="donation">Donation</option>
      </select>
    </label>
  );
}

function NoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-xs font-medium text-stone-500">
        Note, if you have no receipt
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={240}
        placeholder="How it was paid. For example: prepaid ALDI Mobile recharge."
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
