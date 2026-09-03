import { BUSINESS } from "./business";

export type InvoiceLook = {
  totalBarClass: string;
  totalTextClass: string;
  footerBarClass: string;
  footerHeadline: string;
  footerNote: string | null;
};

const CLEANING: InvoiceLook = {
  totalBarClass: "bg-[#5c4a32]",
  totalTextClass: "text-white",
  footerBarClass:
    "bg-gradient-to-r from-[#5c4a32] via-[#7a6448] to-[#5c4a32] text-white",
  footerHeadline: BUSINESS.footerThanks,
  footerNote: `${BUSINESS.footerNote} · Thank you for your business.`,
};

const ADMIN: InvoiceLook = {
  totalBarClass: "bg-[#c4a574]",
  totalTextClass: "text-[#3d3a35]",
  footerBarClass:
    "bg-gradient-to-r from-[#c4a574] via-[#d4b88a] to-[#c4a574] text-[#3d3a35]",
  footerHeadline: "Thank you for your business",
  footerNote: null,
};

export function invoiceLook(showLogo: boolean | undefined): InvoiceLook {
  return showLogo === false ? ADMIN : CLEANING;
}
