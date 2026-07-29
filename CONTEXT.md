# Radiant Rooms Co Invoicing

Invoice builder and books ledger for Radiant Rooms Co cleaning care home services. Compose an Invoice, download a PDF, and save it to Books. Track expenses and see profit (income − expenses) for the month, year, or all time.

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
The payment state shown on the Invoice: Due on receipt, Paid, Overdue, or Draft. Paid is set manually and does not control whether the amount counts as income.
_Avoid_: State, payment status

**Recommendation**:
A short aftercare tip printed on the Invoice to suggest follow-up cleaning.
_Avoid_: Tip, note, upsell

**Books**:
The ledger home showing Income, Expenses, and Profit for a period, with Invoices and Expenses tabs.
_Avoid_: Dashboard, spreadsheet, accounting

**Expense**:
A simple cost row with date, description, and amount (AUD).
_Avoid_: Outgoing, cost category, bill

**Profit**:
Income (saved invoice amounts) minus expenses for the selected period.
_Avoid_: Margin, net, earnings
