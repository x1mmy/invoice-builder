# Radiant Rooms Co — Invoice Builder

Lean Next.js invoice builder for **Radiant Rooms Co**. Fill in the form, preview a styled HTML invoice, then tap **Download PDF** to save a real PDF file (works on phone, iPad, and computer). No database — drafts soft-save in this browser’s `localStorage` only.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Download PDF

1. Fill in the invoice fields (preview updates live).
2. Tap **Download PDF** — the file saves directly (no print dialog).
3. On iPhone/iPad, open the downloaded file and use Share if you want to send it.

## Deploy (Vercel)

Connect the repo to Vercel and deploy as a standard Next.js app. No environment variables required for v1.

## Notes

- **Drafts** are per-browser. Clearing site data or tapping **New invoice** removes the draft.
- The PDF is the system of record — nothing is stored on a server.
- Domain language: see [`CONTEXT.md`](CONTEXT.md). Architecture decisions: [`docs/adr/`](docs/adr/).
