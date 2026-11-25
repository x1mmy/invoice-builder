import { sumAmounts } from "@/lib/period";
import type { CashJobCharge } from "@/lib/cash-job-input";
import type { Invoice, InvoiceStatus } from "@/lib/types";

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  job_date: string;
  client_name: string;
  amount: number;
  status: InvoiceStatus;
  payload: Invoice;
  created_at: string;
};

export type ExpenseRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  kind?: "operating" | "donation";
  note?: string;
  created_at: string;
};

export type CashJobRow = {
  id: string;
  date: string;
  description: string;
  breakdown: string;
  hours: number;
  rate: number;
  extra_charges: CashJobCharge[];
  amount: number;
  created_at: string;
};

export type BooksTotals = {
  income: number;
  received: number;
  expenses: number;
  cashJobs: number;
  profit: number;
};

export function isPaidStatus(status: string): boolean {
  return status === "Paid";
}

export function paidInvoices<T extends { status: string }>(invoices: T[]): T[] {
  return invoices.filter((row) => isPaidStatus(row.status));
}

export function unpaidInvoices<T extends { status: string }>(invoices: T[]): T[] {
  return invoices.filter((row) => !isPaidStatus(row.status));
}

export function stillToReceive(income: number, received: number): number {
  return Math.round((income - received) * 100) / 100;
}

export function sumReceived(
  invoices: { amount: number | string; status: string }[],
): number {
  return sumAmounts(paidInvoices(invoices));
}
