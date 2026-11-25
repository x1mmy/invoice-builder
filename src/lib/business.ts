import { formatDisplayDate } from "./calc";
import type { InvoiceStatus } from "./types";

const NAME = "Radiant Rooms Co";
const OWNER = "Zamilah Pervez";

export const BUSINESS = {
  name: NAME,
  owner: OWNER,
  legalName: "RADIANT ROOMS CO",
  logoSrc: "/logo.png",
  abn: "89 766 007 046",
  email: "Radiant.Rooms.Co1@gmail.com",
  mobile: "0432 806 679",
  bank: {
    accountName: OWNER,
    bsb: "032-076",
    accountNumber: "649136",
  },
  footerThanks: `Thank you for choosing ${NAME}.`,
  footerNote:
    "We appreciate your trust in our premium cleaning care home services.",
  paymentNote:
    "Payment is due upon receipt. Please use the invoice number as your payment reference. For questions contact us via the email or mobile above.",
} as const;

export function paymentNoteForDueDate(
  status: InvoiceStatus,
  dueDate: string,
): string {
  if (status !== "Due by" || !dueDate) return BUSINESS.paymentNote;
  return BUSINESS.paymentNote.replace(
    "Payment is due upon receipt.",
    `Payment is due by ${formatDisplayDate(dueDate)}.`,
  );
}
