import { BUSINESS } from "./business";
import { prepareCloneForHtml2Canvas } from "./pdfSanitize";

function buildFilename(invoiceNumber: string): string {
  const slug = BUSINESS.name.replace(/\s+/g, "-");
  const num = invoiceNumber.trim().replace(/[^\w.-]+/g, "") || "draft";
  return `${slug}-Invoice-${num}.pdf`;
}

/**
 * Capture the invoice preview as a real PDF file download.
 * Works on iPhone/iPad (no print sheet) and desktop.
 */
export async function downloadInvoicePdf(invoiceNumber: string): Promise<void> {
  const el = document.getElementById("invoice-preview");
  if (!el) {
    throw new Error("Invoice preview not found");
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f7f5f0",
    logging: false,
    // Tailwind v4 → lab/oklab computed colors crash html2canvas; rewrite clone.
    onclone: (_clonedDoc, clonedEl) => {
      prepareCloneForHtml2Canvas(clonedEl);
    },
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 1) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const filename = buildFilename(invoiceNumber);

  // Prefer blob + anchor for more reliable save on iOS Safari
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Delay revoke so Safari can start the download
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
