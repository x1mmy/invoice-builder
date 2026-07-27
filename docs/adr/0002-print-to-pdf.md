# 0002. Print-to-PDF via the browser

## Status

Accepted

## Context

The invoice is rendered as styled HTML. We need a “Download PDF” action without a database or heavy PDF pipeline. Options considered: browser print dialog, client-side html2canvas/jsPDF, and server-side PDF generation.

## Decision

Use `window.print()` with `@media print` CSS that hides the form chrome and prints only the invoice preview. The button is labelled for downloading a PDF; the user chooses “Save as PDF” in the print dialog.

## Consequences

- Highest visual fidelity to the HTML preview with the least code.
- UX depends on the browser print dialog (one extra click to save).
- Print CSS must be maintained carefully for A4 layout.
- No server CPU cost or PDF library dependency.
