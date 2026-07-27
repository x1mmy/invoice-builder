# 0002. Client-side PDF file download

## Status

Accepted (supersedes print-dialog approach)

## Context

The invoice is rendered as styled HTML. Mum needs a “Download PDF” action that works well on iPhone and iPad, where the browser print sheet makes “Save as PDF” hard to find. Options considered: browser print dialog, client-side html2canvas/jsPDF, and server-side PDF generation.

## Decision

Generate a real `.pdf` in the browser with `html2canvas` + `jsPDF`, capturing `#invoice-preview`, then trigger a file download via a blob URL. No print dialog.

## Consequences

- One-tap save on mobile and desktop; better iOS/iPad UX.
- PDF is a rasterised snapshot of the HTML (scale 2) — good fidelity, larger files than vector PDF.
- Adds `html2canvas` and `jspdf` client dependencies.
- Print CSS remains as a fallback path if needed later, but is not the primary download flow.
