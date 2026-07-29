# 0001. Client-only — no database

## Status

Superseded by [0003](0003-supabase-books-ledger.md)

## Context

Radiant Rooms needs a lean invoice builder. Mum creates an invoice, downloads a PDF, and sends it to the client. There is no need to search past invoices, track payments, or sync across devices in v1.

Storing invoices would require auth, a database, and backup/privacy concerns for a solo operator tool.

## Decision

Do not use a database or server-side storage. Invoice data lives in React state while editing. A soft draft may persist in the browser’s `localStorage` so a refresh does not lose work. The downloaded PDF is the system of record.

## Consequences

- No invoice history, multi-device sync, or server backups.
- Drafts are per-browser and can be cleared by the user or by starting a new invoice.
- Deploy stays simple (static/SSR Next.js on Vercel with no env secrets required for v1).
