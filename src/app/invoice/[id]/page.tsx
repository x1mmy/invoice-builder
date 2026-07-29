import { notFound } from "next/navigation";
import { getInvoice } from "@/app/actions/invoices";
import { InvoiceBuilder } from "@/components/InvoiceBuilder";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const row = await getInvoice(id);
  if (!row) notFound();

  return <InvoiceBuilder invoiceId={row.id} initialInvoice={row.payload} />;
}
