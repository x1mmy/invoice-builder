import { BUSINESS } from "@/lib/business";
import { formatMoney } from "@/lib/calc";
import { formatLongDate } from "@/lib/period";
import {
  donationNote,
  profitReceivedNote,
  statementHeading,
  statementPdfFilename,
  type ProfitLossStatement,
  type StatementExpense,
} from "@/lib/profit-loss";
import type { jsPDF } from "jspdf";

const PAGE_W = 210;
const PAGE_H = 297;
const LEFT = 20;
const RIGHT = PAGE_W - 20;
const TOP = 18;
const BOTTOM = 18;
const WIDTH = RIGHT - LEFT;

const DATE_W = 34;
const AMOUNT_W = 32;
const DESC_X = LEFT + DATE_W + 4;
const DESC_W = WIDTH - DATE_W - AMOUNT_W - 8;

const INK: [number, number, number] = [47, 52, 55];
const MUTED: [number, number, number] = [120, 119, 116];
const SAGE: [number, number, number] = [95, 122, 100];
const HAIR: [number, number, number] = [226, 225, 221];

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

function scaleFactor(pdf: jsPDF): number {
  return (pdf.internal as { scaleFactor: number }).scaleFactor;
}

/** Distance from one baseline to the next, in millimetres. */
function baselineStep(pdf: jsPDF): number {
  return pdf.getLineHeight() / scaleFactor(pdf);
}

/** Millimetres from this baseline to the next row, including wrapped lines. */
function blockHeight(pdf: jsPDF, lineCount: number): number {
  const step = baselineStep(pdf);
  const descender = pdf.getFontSize() * 0.3 / scaleFactor(pdf);
  const quiet = 3.6;
  return Math.max(7.4, (Math.max(lineCount, 1) - 1) * step + descender + quiet);
}

function drawContinuedHeader(pdf: jsPDF, statement: ProfitLossStatement): number {
  let y = TOP;
  pdf.setFont("times", "bold");
  pdf.setFontSize(11);
  ink(pdf, INK);
  pdf.text(BUSINESS.name, LEFT, y);
  pdf.setFont("times", "italic");
  pdf.text(statementHeading, RIGHT, y, { align: "right" });
  y += 5;
  pdf.setFont("times", "normal");
  pdf.setFontSize(10);
  ink(pdf, INK);
  pdf.text(BUSINESS.owner, LEFT, y);
  y += 4.6;
  pdf.setFontSize(9);
  ink(pdf, MUTED);
  pdf.text(`${statement.periodLabel}   ${statement.rangeLabel}`, LEFT, y);
  y += 3.4;
  rule(pdf, y, HAIR, 0.2);
  return y + 9;
}

function drawFirstHeader(pdf: jsPDF, statement: ProfitLossStatement): number {
  let y = TOP;
  pdf.setFont("times", "bold");
  pdf.setFontSize(11);
  ink(pdf, INK);
  pdf.text(BUSINESS.name.toUpperCase(), LEFT, y);
  pdf.setFont("times", "normal");
  pdf.setFontSize(9);
  ink(pdf, MUTED);
  pdf.text(`ABN ${BUSINESS.abn}`, RIGHT, y, { align: "right" });
  y += 5.2;
  pdf.setFont("times", "italic");
  pdf.setFontSize(12);
  ink(pdf, INK);
  pdf.text(BUSINESS.owner, LEFT, y);
  y += 11;
  pdf.setFont("times", "bold");
  pdf.setFontSize(26);
  ink(pdf, INK);
  pdf.text(statementHeading, LEFT, y);
  y += 8;
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.text(statement.periodLabel, LEFT, y);
  y += 5.5;
  pdf.setFont("times", "italic");
  pdf.setFontSize(11);
  ink(pdf, MUTED);
  if (statement.yearToDate) {
    pdf.text("Year to date", LEFT, y);
    y += 5;
  }
  pdf.text(statement.rangeLabel, LEFT, y);
  y += 4.5;
  pdf.setFontSize(10);
  pdf.text(statement.preparedLabel, LEFT, y);
  y += 4.5;
  rule(pdf, y, SAGE, 0.4);
  return y + 10;
}

function sectionLabel(pdf: jsPDF, y: number, label: string): number {
  pdf.setFont("times", "bold");
  pdf.setFontSize(9);
  ink(pdf, SAGE);
  pdf.text(label, LEFT, y);
  return y + 7;
}

function moneyLine(
  pdf: jsPDF,
  y: number,
  label: string,
  amount: number,
  emphasis = false,
): number {
  pdf.setFont("times", emphasis ? "bold" : "normal");
  pdf.setFontSize(emphasis ? 12 : 11);
  ink(pdf, INK);
  pdf.text(label, LEFT, y);
  pdf.text(pdfMoney(amount), RIGHT, y, { align: "right" });
  return y + (emphasis ? 8 : 6.4);
}

function expenseColumns(pdf: jsPDF, y: number): number {
  pdf.setFont("times", "normal");
  pdf.setFontSize(8);
  ink(pdf, MUTED);
  pdf.text("DATE", LEFT, y);
  pdf.text("DESCRIPTION", DESC_X, y);
  pdf.text("AMOUNT", RIGHT, y, { align: "right" });
  rule(pdf, y + 2.6, HAIR, 0.2);
  return y + 8;
}

function rowLines(pdf: jsPDF, row: StatementExpense): string[] {
  const text = row.note
    ? `${row.description || "-"}\n${row.note}`
    : row.description || "-";
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  const lines = pdf.splitTextToSize(text, DESC_W);
  return lines.length ? lines : ["-"];
}

function drawExpenseRow(
  pdf: jsPDF,
  y: number,
  row: StatementExpense,
  lines: string[],
): number {
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  ink(pdf, INK);
  pdf.text(formatLongDate(row.date), LEFT, y);
  pdf.text(lines, DESC_X, y);
  pdf.text(pdfMoney(row.amount), RIGHT, y, { align: "right" });
  return y + blockHeight(pdf, lines.length);
}

function noteLines(pdf: jsPDF): string[] {
  pdf.setFont("times", "italic");
  pdf.setFontSize(9);
  return pdf.splitTextToSize(profitReceivedNote, WIDTH * 0.72);
}

function noteAdvance(pdf: jsPDF, lineCount: number): number {
  return blockHeight(pdf, lineCount) + 2;
}

function profitBlockHeight(pdf: jsPDF): number {
  return 18 + noteAdvance(pdf, noteLines(pdf).length) + 4;
}

function drawProfitBlock(pdf: jsPDF, y: number, statement: ProfitLossStatement) {
  rule(pdf, y, SAGE, 0.35);
  y += 8;
  pdf.setFont("times", "bold");
  pdf.setFontSize(16);
  ink(pdf, INK);
  pdf.text("Profit", LEFT, y);
  pdf.text(pdfMoney(statement.profit), RIGHT, y, { align: "right" });
  y += 8;
  const lines = noteLines(pdf);
  ink(pdf, MUTED);
  pdf.text(lines, LEFT, y);
  y += noteAdvance(pdf, lines.length);
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  ink(pdf, INK);
  pdf.text("Received", LEFT, y);
  pdf.text(pdfMoney(statement.received), RIGHT, y, { align: "right" });
}

function stampPageNumbers(pdf: jsPDF) {
  const total = pdf.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    pdf.setPage(page);
    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    ink(pdf, MUTED);
    pdf.text(`${page} / ${total}`, RIGHT, PAGE_H - 10, { align: "right" });
  }
}

/** Draw a text statement. Page breaks fall between expense rows. */
export function renderStatementPdf(pdf: jsPDF, statement: ProfitLossStatement): void {
  pdf.setProperties({
    title: `${statementHeading} — ${statement.periodLabel}`,
    author: BUSINESS.name,
    subject: statement.rangeLabel,
  });

  let y = drawFirstHeader(pdf, statement);
  y = sectionLabel(pdf, y, "INCOME");
  y = moneyLine(pdf, y, "Invoiced", statement.invoiced);
  y = moneyLine(pdf, y, "Cash jobs", statement.cashJobs);
  y += 1.5;
  rule(pdf, y, HAIR, 0.25);
  y += 6;
  y = moneyLine(pdf, y, "Total income", statement.totalIncome, true);
  y += 4;

  const beginPage = () => {
    pdf.addPage();
    y = drawContinuedHeader(pdf, statement);
  };

  const groups: {
    title: string;
    rows: StatementExpense[];
    totalLabel: string;
    total: number;
    footnote: string | null;
  }[] = [
    {
      title: "OPERATING EXPENSES",
      rows: statement.operatingExpenses,
      totalLabel: "Total operating expenses",
      total: statement.totalOperating,
      footnote: null,
    },
    {
      title: "DONATIONS",
      rows: statement.donations,
      totalLabel: "Total donations",
      total: statement.totalDonations,
      footnote: donationNote,
    },
  ];

  for (const group of groups) {
    if (!fits(y, 28)) beginPage();
    y = sectionLabel(pdf, y, group.title);
    if (group.rows.length === 0) {
      pdf.setFont("times", "italic");
      pdf.setFontSize(11);
      ink(pdf, MUTED);
      pdf.text("None in this period.", LEFT, y);
      y += 8;
    } else {
      y = expenseColumns(pdf, y);
      for (const row of group.rows) {
        const lines = rowLines(pdf, row);
        const height = blockHeight(pdf, lines.length);
        if (!fits(y, height)) {
          beginPage();
          y = sectionLabel(pdf, y, group.title);
          y = expenseColumns(pdf, y);
        }
        y = drawExpenseRow(pdf, y, row, lines);
      }
    }
    if (!fits(y, group.footnote ? 32 : 16)) beginPage();
    y += 2;
    rule(pdf, y, HAIR, 0.25);
    y += 6;
    y = moneyLine(pdf, y, group.totalLabel, group.total, true);
    if (group.footnote) {
      pdf.setFont("times", "italic");
      pdf.setFontSize(9);
      const lines = pdf.splitTextToSize(group.footnote, WIDTH);
      const advance = noteAdvance(pdf, lines.length);
      if (!fits(y, advance)) beginPage();
      ink(pdf, MUTED);
      pdf.text(lines, LEFT, y);
      y += advance;
    }
    y += 3;
  }

  if (!fits(y, 16)) beginPage();
  y += 2;
  rule(pdf, y, HAIR, 0.25);
  y += 6;
  y = moneyLine(pdf, y, "Total expenses", statement.totalExpenses, true);
  y += 3;

  if (!fits(y, profitBlockHeight(pdf))) beginPage();
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
