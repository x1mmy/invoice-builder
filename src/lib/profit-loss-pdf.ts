import { BUSINESS } from "@/lib/business";
import { formatMoney } from "@/lib/calc";
import { formatLongDate } from "@/lib/period";
import {
  statementPdfFilename,
  type ProfitLossStatement,
  type StatementExpense,
} from "@/lib/profit-loss";
import type { jsPDF } from "jspdf";

const PAGE_W = 210;
const PAGE_H = 297;
const LEFT = 16;
const RIGHT = PAGE_W - 16;
const TOP = 18;
const BOTTOM = 18;
const WIDTH = RIGHT - LEFT;

const DATE_W = 32;
const AMOUNT_W = 34;
const DESC_X = LEFT + DATE_W;
const DESC_W = WIDTH - DATE_W - AMOUNT_W;

const INK: [number, number, number] = [41, 37, 36];
const MUTED: [number, number, number] = [120, 113, 108];
const SAGE: [number, number, number] = [95, 122, 100];
const HAIR: [number, number, number] = [214, 211, 209];

const RECEIVED_NOTE =
  "Profit is invoiced plus cash jobs, minus expenses. Received is the sum of invoices marked Paid in this period. Paid status does not change Profit.";

function pdfMoney(amount: number): string {
  return formatMoney(amount)
    .replace(/\u00a0/g, " ")
    .replace(/\u202f/g, " ")
    .replace(/\u2212/g, "-");
}

function ink(pdf: jsPDF, color: [number, number, number]) {
  pdf.setTextColor(color[0], color[1], color[2]);
}

function rule(
  pdf: jsPDF,
  y: number,
  color: [number, number, number],
  width: number,
) {
  pdf.setDrawColor(color[0], color[1], color[2]);
  pdf.setLineWidth(width);
  pdf.line(LEFT, y, RIGHT, y);
}

function fits(y: number, needed: number): boolean {
  return y + needed <= PAGE_H - BOTTOM;
}

function drawContinuedHeader(pdf: jsPDF, statement: ProfitLossStatement): number {
  let y = TOP;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  ink(pdf, INK);
  pdf.text(BUSINESS.name, LEFT, y);
  pdf.setFont("helvetica", "normal");
  pdf.text("Profit & loss", RIGHT, y, { align: "right" });
  y += 5;
  pdf.setFontSize(9);
  ink(pdf, MUTED);
  pdf.text(`${statement.periodLabel}  |  ${statement.rangeLabel}`, LEFT, y);
  y += 3.2;
  rule(pdf, y, SAGE, 0.35);
  return y + 8;
}

function drawFirstHeader(pdf: jsPDF, statement: ProfitLossStatement): number {
  let y = TOP;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  ink(pdf, INK);
  pdf.text(BUSINESS.name, LEFT, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  ink(pdf, MUTED);
  pdf.text(`ABN ${BUSINESS.abn}`, LEFT, y);
  y += 12;
  pdf.setFont("times", "bold");
  pdf.setFontSize(22);
  ink(pdf, INK);
  pdf.text("Profit & loss", LEFT, y);
  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text(statement.periodLabel, LEFT, y);
  y += 5.5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  ink(pdf, MUTED);
  pdf.text(statement.rangeLabel, LEFT, y);
  y += 4;
  rule(pdf, y, SAGE, 0.7);
  return y + 9;
}

function sectionLabel(pdf: jsPDF, y: number, label: string): number {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  ink(pdf, SAGE);
  pdf.text(label, LEFT, y);
  return y + 6.5;
}

function moneyLine(
  pdf: jsPDF,
  y: number,
  label: string,
  amount: number,
  emphasis = false,
): number {
  pdf.setFont("helvetica", emphasis ? "bold" : "normal");
  pdf.setFontSize(emphasis ? 11 : 10);
  ink(pdf, INK);
  pdf.text(label, LEFT, y);
  pdf.text(pdfMoney(amount), RIGHT, y, { align: "right" });
  return y + (emphasis ? 7 : 5.8);
}

function hairline(pdf: jsPDF, y: number): number {
  rule(pdf, y, HAIR, 0.2);
  return y + 5.5;
}

function expenseColumns(pdf: jsPDF, y: number): number {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  ink(pdf, MUTED);
  pdf.text("DATE", LEFT, y);
  pdf.text("DESCRIPTION", DESC_X, y);
  pdf.text("AMOUNT", RIGHT, y, { align: "right" });
  return hairline(pdf, y + 1.6);
}

function descriptionLines(pdf: jsPDF, description: string): string[] {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const lines = pdf.splitTextToSize(description || "-", DESC_W);
  return lines.length ? lines : ["-"];
}

function rowHeight(lineCount: number): number {
  return Math.max(6.2, lineCount * 4.4 + 1.8);
}

function drawExpenseRow(
  pdf: jsPDF,
  y: number,
  row: StatementExpense,
  lines: string[],
): number {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  ink(pdf, INK);
  pdf.text(formatLongDate(row.date), LEFT, y);
  pdf.text(lines, DESC_X, y, { lineHeightFactor: 1.25 });
  pdf.text(pdfMoney(row.amount), RIGHT, y, { align: "right" });
  const next = y + rowHeight(lines.length);
  rule(pdf, next - 1.4, HAIR, 0.15);
  return next;
}

function noteLines(pdf: jsPDF): string[] {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  return pdf.splitTextToSize(RECEIVED_NOTE, WIDTH);
}

function profitBlockHeight(pdf: jsPDF): number {
  return 4 + 8 + 8 + noteLines(pdf).length * 4.2 + 6 + 6;
}

function drawProfitBlock(pdf: jsPDF, y: number, statement: ProfitLossStatement) {
  rule(pdf, y, SAGE, 0.45);
  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  ink(pdf, INK);
  pdf.text("Profit", LEFT, y);
  pdf.text(pdfMoney(statement.profit), RIGHT, y, { align: "right" });
  y += 8;
  const lines = noteLines(pdf);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  ink(pdf, MUTED);
  pdf.text(lines, LEFT, y, { lineHeightFactor: 1.3 });
  y += lines.length * 4.2 + 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  ink(pdf, INK);
  pdf.text("Received", LEFT, y);
  pdf.text(pdfMoney(statement.received), RIGHT, y, { align: "right" });
}

function stampPageNumbers(pdf: jsPDF) {
  const total = pdf.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    ink(pdf, MUTED);
    pdf.text(`${page} / ${total}`, RIGHT, PAGE_H - 10, { align: "right" });
  }
}

/** Draw a text statement. Page breaks fall between expense rows. */
export function renderStatementPdf(pdf: jsPDF, statement: ProfitLossStatement): void {
  pdf.setProperties({
    title: `Profit & loss — ${statement.periodLabel}`,
    author: BUSINESS.name,
    subject: statement.rangeLabel,
  });

  let y = drawFirstHeader(pdf, statement);
  y = sectionLabel(pdf, y, "INCOME");
  y = moneyLine(pdf, y, "Invoiced", statement.invoiced);
  y = moneyLine(pdf, y, "Cash jobs", statement.cashJobs);
  y = hairline(pdf, y);
  y = moneyLine(pdf, y, "Total income", statement.totalIncome, true);
  y += 4;

  const startExpenses = (continued: boolean) => {
    if (continued) {
      pdf.addPage();
      y = drawContinuedHeader(pdf, statement);
    }
    y = sectionLabel(pdf, y, "EXPENSES");
    y = expenseColumns(pdf, y);
  };

  if (!fits(y, 24)) startExpenses(true);
  else startExpenses(false);

  if (statement.expenses.length === 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    ink(pdf, MUTED);
    pdf.text("No expenses in this period.", LEFT, y);
    y += 8;
  } else {
    for (const row of statement.expenses) {
      const lines = descriptionLines(pdf, row.description);
      const height = rowHeight(lines.length);
      if (!fits(y, height)) startExpenses(true);
      y = drawExpenseRow(pdf, y, row, lines);
    }
  }

  if (!fits(y, 8)) {
    pdf.addPage();
    y = drawContinuedHeader(pdf, statement);
  }
  if (statement.expenses.length === 0) y = hairline(pdf, y);
  else y += 3.2;
  y = moneyLine(pdf, y, "Total expenses", statement.totalExpenses, true);
  y += 3;

  if (!fits(y, profitBlockHeight(pdf))) {
    pdf.addPage();
    y = drawContinuedHeader(pdf, statement);
  }
  drawProfitBlock(pdf, y, statement);
  stampPageNumbers(pdf);
}

export async function downloadStatementPdf(
  statement: ProfitLossStatement,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  renderStatementPdf(pdf, statement);

  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = statementPdfFilename(statement);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
