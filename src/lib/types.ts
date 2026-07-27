export type InvoiceStatus = "Due on receipt" | "Paid" | "Overdue" | "Draft";

export type Client = {
  name: string;
  addressLine1: string;
  addressLine2: string;
};

export type ServiceDetails = {
  serviceName: string;
  startTime: string;
  endTime: string;
  hoursPerStaff: number | "";
  staffCount: number | "";
  breakMinutes: number | "";
};

export type AreaServiced = {
  id: string;
  label: string;
  notes: string;
  included: boolean;
  isCustom: boolean;
};

export type LineItem = {
  id: string;
  service: string;
  details: string;
  hours: number | "";
  rate: number | "";
  /** When hours are set, amount is derived; when hours empty, amount is typed (flat fee). */
  amount: number | "";
};

export type Recommendation = {
  id: string;
  text: string;
  included: boolean;
};

export type Invoice = {
  client: Client;
  invoiceNumber: string;
  invoiceDate: string;
  jobDate: string;
  status: InvoiceStatus;
  serviceDetails: ServiceDetails;
  areas: AreaServiced[];
  lineItems: LineItem[];
  recommendations: Recommendation[];
};
