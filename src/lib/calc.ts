import type { LineItem, ServiceDetails } from "./types";

/** True when hours + rate drive the amount (not a flat fee). */
export function isHourlyLine(item: LineItem): boolean {
  return item.hours !== "" && Number(item.hours) > 0 && item.rate !== "";
}

export function lineAmount(item: LineItem): number {
  if (isHourlyLine(item)) {
    return roundMoney(Number(item.hours) * Number(item.rate));
  }
  if (item.amount === "") return 0;
  return roundMoney(Number(item.amount));
}

export function subtotal(items: LineItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + lineAmount(item), 0));
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });
}

/** Display details for the pretty 3-column pricing table. */
export function lineDetailsDisplay(item: LineItem): string {
  if (item.details.trim()) return item.details.trim();
  if (isHourlyLine(item)) {
    const hours = Number(item.hours);
    const rate = Number(item.rate);
    const hoursLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
    return `${hoursLabel} hours at ${formatMoney(rate)}/hr`;
  }
  return "";
}

export function serviceSummary(details: ServiceDetails): string {
  const parts: string[] = [];

  if (details.startTime && details.endTime) {
    parts.push(`${formatTime(details.startTime)} – ${formatTime(details.endTime)}`);
  } else if (details.startTime) {
    parts.push(formatTime(details.startTime));
  }

  const meta: string[] = [];
  if (details.hoursPerStaff !== "") {
    meta.push(`${details.hoursPerStaff}\u00A0hours per staff`);
  }
  if (details.staffCount !== "") {
    meta.push(`${details.staffCount}\u00A0staff`);
  }
  if (details.breakMinutes !== "" && details.breakMinutes > 0) {
    meta.push(`${details.breakMinutes}min break`);
  }

  if (meta.length) parts.push(meta.join(" · "));
  return parts.join(" · ");
}

function formatTime(value: string): string {
  const [hStr, mStr] = value.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h)) return value;
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minutes = Number.isNaN(m) ? "00" : String(m).padStart(2, "0");
  return `${hour12}:${minutes}${suffix}`;
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${String(y).slice(-2)}`;
}
