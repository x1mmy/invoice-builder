"use client";

import {
  createCustomArea,
  createEmptyLineItem,
  INVOICE_STATUSES,
} from "@/lib/defaults";
import { formatMoney, isHourlyLine, lineAmount } from "@/lib/calc";
import type { AreaServiced, Invoice, LineItem, Recommendation } from "@/lib/types";

type Props = {
  invoice: Invoice;
  onChange: (invoice: Invoice) => void;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-semibold tracking-wide text-stone-500 uppercase">
      {children}
    </label>
  );
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, className = "", ...rest } = props;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        {...rest}
        className={`w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800 outline-none focus:border-[#5f7a64] focus:ring-1 focus:ring-[#5f7a64] ${className}`}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-b border-stone-200 pb-5 last:border-0">
      <h2 className="font-[family-name:var(--font-display)] text-lg text-stone-800">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function InvoiceForm({ invoice, onChange }: Props) {
  const update = (patch: Partial<Invoice>) =>
    onChange({ ...invoice, ...patch });

  const updateArea = (id: string, patch: Partial<AreaServiced>) => {
    onChange({
      ...invoice,
      areas: invoice.areas.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };

  const updateRec = (id: string, patch: Partial<Recommendation>) => {
    onChange({
      ...invoice,
      recommendations: invoice.recommendations.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    });
  };

  const updateLine = (id: string, patch: Partial<LineItem>) => {
    onChange({
      ...invoice,
      lineItems: invoice.lineItems.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (("hours" in patch || "rate" in patch) && isHourlyLine(next)) {
          next.amount = lineAmount(next);
        }
        return next;
      }),
    });
  };

  return (
    <div className="no-print space-y-6">
      <Section title="Billed to">
        <TextInput
          label="Client name"
          value={invoice.client.name}
          onChange={(e) =>
            update({ client: { ...invoice.client, name: e.target.value } })
          }
          placeholder="Lucky and Shweta"
        />
        <TextInput
          label="Address line 1"
          value={invoice.client.addressLine1}
          onChange={(e) =>
            update({
              client: { ...invoice.client, addressLine1: e.target.value },
            })
          }
        />
        <TextInput
          label="Address line 2"
          value={invoice.client.addressLine2}
          onChange={(e) =>
            update({
              client: { ...invoice.client, addressLine2: e.target.value },
            })
          }
        />
      </Section>

      <Section title="Invoice details">
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Invoice number"
            value={invoice.invoiceNumber}
            onChange={(e) => update({ invoiceNumber: e.target.value })}
            placeholder="001"
          />
          <div>
            <FieldLabel>Status</FieldLabel>
            <select
              value={invoice.status}
              onChange={(e) =>
                update({
                  status: e.target.value as Invoice["status"],
                })
              }
              className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800 outline-none focus:border-[#5f7a64] focus:ring-1 focus:ring-[#5f7a64]"
            >
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <TextInput
            label="Invoice date"
            type="date"
            value={invoice.invoiceDate}
            onChange={(e) => update({ invoiceDate: e.target.value })}
          />
          <TextInput
            label="Job date"
            type="date"
            value={invoice.jobDate}
            onChange={(e) => update({ jobDate: e.target.value })}
          />
        </div>
      </Section>

      <Section title="Service details">
        <TextInput
          label="Service"
          value={invoice.serviceDetails.serviceName}
          onChange={(e) =>
            update({
              serviceDetails: {
                ...invoice.serviceDetails,
                serviceName: e.target.value,
              },
            })
          }
          placeholder="Deep Clean"
        />
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Start time"
            type="time"
            value={invoice.serviceDetails.startTime}
            onChange={(e) =>
              update({
                serviceDetails: {
                  ...invoice.serviceDetails,
                  startTime: e.target.value,
                },
              })
            }
          />
          <TextInput
            label="End time"
            type="time"
            value={invoice.serviceDetails.endTime}
            onChange={(e) =>
              update({
                serviceDetails: {
                  ...invoice.serviceDetails,
                  endTime: e.target.value,
                },
              })
            }
          />
          <TextInput
            label="Hours per staff"
            type="number"
            min={0}
            step={0.5}
            value={invoice.serviceDetails.hoursPerStaff}
            onChange={(e) =>
              update({
                serviceDetails: {
                  ...invoice.serviceDetails,
                  hoursPerStaff:
                    e.target.value === "" ? "" : Number(e.target.value),
                },
              })
            }
          />
          <TextInput
            label="Staff count"
            type="number"
            min={0}
            step={1}
            value={invoice.serviceDetails.staffCount}
            onChange={(e) =>
              update({
                serviceDetails: {
                  ...invoice.serviceDetails,
                  staffCount:
                    e.target.value === "" ? "" : Number(e.target.value),
                },
              })
            }
          />
          <TextInput
            label="Break (minutes)"
            type="number"
            min={0}
            step={5}
            value={invoice.serviceDetails.breakMinutes}
            onChange={(e) =>
              update({
                serviceDetails: {
                  ...invoice.serviceDetails,
                  breakMinutes:
                    e.target.value === "" ? "" : Number(e.target.value),
                },
              })
            }
          />
        </div>
      </Section>

      <Section title="Areas serviced">
        <ul className="space-y-3">
          {invoice.areas.map((area) => (
            <li
              key={area.id}
              className="rounded-md border border-stone-200 bg-white/70 p-2.5"
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={area.included}
                  onChange={(e) =>
                    updateArea(area.id, { included: e.target.checked })
                  }
                  className="mt-2 accent-[#5f7a64]"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <input
                    value={area.label}
                    onChange={(e) =>
                      updateArea(area.id, { label: e.target.value })
                    }
                    placeholder="Area name"
                    className="w-full rounded border border-stone-200 px-2 py-1 text-sm font-medium outline-none focus:border-[#5f7a64]"
                  />
                  <input
                    value={area.notes}
                    onChange={(e) =>
                      updateArea(area.id, { notes: e.target.value })
                    }
                    placeholder="Notes (what was cleaned)"
                    className="w-full rounded border border-stone-200 px-2 py-1 text-xs text-stone-600 outline-none focus:border-[#5f7a64]"
                  />
                </div>
                {area.isCustom && (
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        areas: invoice.areas.filter((a) => a.id !== area.id),
                      })
                    }
                    className="mt-1 text-xs text-stone-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() =>
            update({ areas: [...invoice.areas, createCustomArea()] })
          }
          className="text-sm font-medium text-[#5f7a64] hover:underline"
        >
          + Add custom area
        </button>
      </Section>

      <Section title="Pricing">
        <div className="space-y-3">
          {invoice.lineItems.map((item, index) => {
            const computed = isHourlyLine(item);
            return (
              <div
                key={item.id}
                className="rounded-md border border-stone-200 bg-white/70 p-2.5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500">
                    Line {index + 1}
                  </span>
                  {invoice.lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          lineItems: invoice.lineItems.filter(
                            (l) => l.id !== item.id,
                          ),
                        })
                      }
                      className="text-xs text-stone-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput
                    label="Service"
                    value={item.service}
                    onChange={(e) =>
                      updateLine(item.id, { service: e.target.value })
                    }
                    placeholder="Staff 1"
                  />
                  <TextInput
                    label="Details"
                    value={item.details}
                    onChange={(e) =>
                      updateLine(item.id, { details: e.target.value })
                    }
                    placeholder="Optional"
                  />
                  <TextInput
                    label="Hours"
                    type="number"
                    min={0}
                    step={0.5}
                    value={item.hours}
                    onChange={(e) =>
                      updateLine(item.id, {
                        hours:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                  <TextInput
                    label="Rate ($/hr)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.rate}
                    onChange={(e) =>
                      updateLine(item.id, {
                        rate:
                          e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                  <div className="col-span-2">
                    <TextInput
                      label={
                        computed
                          ? `Amount (auto ${formatMoney(lineAmount(item))})`
                          : "Amount (flat fee if hours empty)"
                      }
                      type="number"
                      min={0}
                      step={0.01}
                      value={computed ? lineAmount(item) : item.amount}
                      readOnly={computed}
                      onChange={(e) =>
                        updateLine(item.id, {
                          amount:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        })
                      }
                      className={computed ? "bg-stone-50 text-stone-600" : ""}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() =>
            update({
              lineItems: [...invoice.lineItems, createEmptyLineItem()],
            })
          }
          className="text-sm font-medium text-[#5f7a64] hover:underline"
        >
          + Add line item
        </button>
      </Section>

      <Section title="Recommendations">
        <ul className="space-y-2">
          {invoice.recommendations.map((rec) => (
            <li key={rec.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={rec.included}
                onChange={(e) =>
                  updateRec(rec.id, { included: e.target.checked })
                }
                className="mt-2 accent-[#5f7a64]"
              />
              <textarea
                value={rec.text}
                onChange={(e) => updateRec(rec.id, { text: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800 outline-none focus:border-[#5f7a64] focus:ring-1 focus:ring-[#5f7a64]"
              />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
