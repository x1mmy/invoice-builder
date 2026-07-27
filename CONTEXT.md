# Radiant Rooms Co Invoicing

Lean invoice builder for Radiant Rooms Co cleaning care home services. An Invoice is composed in the browser and captured as a PDF — there is no server-side record of jobs or payments.

## Language

**Invoice**:
A payment request for a completed (or scheduled) cleaning job, addressed to a Client.
_Avoid_: Bill, receipt, quote

**Client**:
The person or household billed for the cleaning job (the "billed to" party).
_Avoid_: Customer, account, buyer

**ServiceDetails**:
The narrative of the job — service name, time window, staff count, hours per staff, and break — shown on the Invoice separately from pricing.
_Avoid_: Job summary, booking

**AreaServiced**:
A room or zone cleaned on the job, with an optional notes line describing what was done.
_Avoid_: Room, task, checklist item

**LineItem**:
A single priced row on the Invoice (labour, travel, supplies, or other), with service label, details, optional hours and rate, and amount.
_Avoid_: Charge, fee row, product

**Status**:
The payment state shown on the Invoice: Due on receipt, Paid, Overdue, or Draft.
_Avoid_: State, payment status

**Recommendation**:
A short aftercare tip printed on the Invoice to suggest follow-up cleaning.
_Avoid_: Tip, note, upsell
