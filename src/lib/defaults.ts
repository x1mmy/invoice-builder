import type {
  AreaServiced,
  Invoice,
  InvoiceStatus,
  LineItem,
  Recommendation,
} from "./types";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "Due on receipt",
  "Paid",
  "Overdue",
  "Draft",
];

const AREA_PRESETS: Omit<AreaServiced, "id" | "included" | "isCustom">[] = [
  {
    label: "Kitchen",
    notes: "benchtops, sink, appliances exterior, cabinetry",
  },
  {
    label: "Bathrooms",
    notes: "shower, toilet, vanity, mirrors, tiles",
  },
  {
    label: "Bedrooms",
    notes: "dusting, vacuuming, surface wipe-down",
  },
  {
    label: "Living Room",
    notes: "dusting, vacuum, skirting boards",
  },
  {
    label: "Hallways & Laundry",
    notes: "vacuum, mop, wipe surfaces",
  },
  {
    label: "Windows & Mirrors",
    notes: "interior glass cleaning",
  },
];

const DEFAULT_RECOMMENDATIONS: Omit<Recommendation, "id" | "included">[] = [
  {
    text: "Regular monthly maintenance clean recommended to keep home at peak standard",
  },
  {
    text: "Focus on high-touch surfaces for improved hygiene between deep cleans",
  },
  {
    text: "Book a deep clean every 3-6 months to maintain peak standard",
  },
];

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyLineItem(): LineItem {
  return {
    id: uid(),
    service: "",
    details: "",
    hours: "",
    rate: "",
    amount: "",
  };
}

export function createCustomArea(): AreaServiced {
  return {
    id: uid(),
    label: "",
    notes: "",
    included: true,
    isCustom: true,
  };
}

export function createDefaultInvoice(): Invoice {
  const dateStr = formatDateInput(new Date());

  return {
    client: {
      name: "",
      addressLine1: "",
      addressLine2: "",
    },
    invoiceNumber: "",
    invoiceDate: dateStr,
    jobDate: dateStr,
    status: "Due on receipt",
    serviceDetails: {
      serviceName: "Deep Clean",
      startTime: "",
      endTime: "",
      hoursPerStaff: "",
      staffCount: "",
      breakMinutes: 30,
    },
    areas: AREA_PRESETS.map((preset) => ({
      id: uid(),
      label: preset.label,
      notes: preset.notes,
      included: true,
      isCustom: false,
    })),
    lineItems: [createEmptyLineItem(), createEmptyLineItem()],
    recommendations: DEFAULT_RECOMMENDATIONS.map((rec) => ({
      id: uid(),
      text: rec.text,
      included: true,
    })),
  };
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
