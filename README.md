# Radiant Rooms — Invoice Builder

Lean Next.js invoice builder for **Radiant Rooms**. Fill in the form, preview a styled HTML invoice, then download a PDF via the browser print dialog. No database — drafts soft-save in this browser’s `localStorage` only.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Download PDF

1. Fill in the invoice fields (preview updates live).
2. Click **Download PDF**.
3. In the print dialog, choose **Save as PDF** (Chrome/Edge) or **PDF** destination (Safari/Firefox).

Tip: enable “Background graphics” in the print dialog so sage/bronze colours print correctly.

## Deploy (Vercel)

Connect the repo to Vercel and deploy as a standard Next.js app. No environment variables required for v1.

## Notes

- **Drafts** are per-browser. Clearing site data or clicking **New invoice** removes the draft.
- The PDF is the system of record — nothing is stored on a server.
- Domain language: see [`CONTEXT.md`](CONTEXT.md). Architecture decisions: [`docs/adr/`](docs/adr/).
