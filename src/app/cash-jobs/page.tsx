import { listCashJobs } from "@/app/actions/cash-jobs";
import { AppNav } from "@/components/AppNav";
import { CashJobsLog } from "@/components/CashJobsLog";

export default async function CashJobsPage() {
  const rows = await listCashJobs("all");

  return (
    <div className="min-h-screen bg-[#e8ebe4]">
      <AppNav />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
        <header>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-800">
            Cash jobs
          </h1>
          <p className="text-sm text-stone-500">
            Jobs paid in cash — details, breakdown, hours, and rate
          </p>
        </header>
        <CashJobsLog rows={rows} />
      </div>
    </div>
  );
}
