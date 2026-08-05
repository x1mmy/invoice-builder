import { sumAmounts } from "@/lib/period";
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
  created_at: string;
};

export type BooksTotals = {
  income: number;
  received: number;
  expenses: number;
  profit: number;
};

export function sumReceived(
  invoices: { amount: number | string; status: string }[],
): number {
  return sumAmounts(invoices.filter((row) => row.status === "Paid"));
}
