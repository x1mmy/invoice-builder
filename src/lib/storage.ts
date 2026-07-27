import type { Invoice } from "./types";

const STORAGE_KEY = "radiant-rooms-invoice-draft";

export function loadDraft(): Invoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Invoice;
    if (!parsed || typeof parsed !== "object" || !parsed.client) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(invoice: Invoice): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoice));
  } catch {
    // Quota or private mode — ignore
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
