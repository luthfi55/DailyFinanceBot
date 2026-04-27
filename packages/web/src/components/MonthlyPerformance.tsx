import Link from "next/link";

type Allocation = { id: string; label: string; amount: number };
type Budget = { startingBalance: number; allocations: Allocation[] } | null;

type Props = {
  budget: Budget;
  totalSpent: number;
  prevMonthTotal: number;
};

export function MonthlyPerformance({ budget, totalSpent, prevMonthTotal }: Props) {
  if (!budget || budget.startingBalance === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Monthly Performance</h2>
          <Link href="/settings" className="text-sm text-green-600 hover:underline font-medium">Update Budget →</Link>
        </div>
        <p className="text-sm text-gray-400">No budget set for this month.</p>
        <p className="text-xs text-gray-300 mt-1">Go to Settings → Monthly Budget to set it up.</p>
      </div>
    );
  }

  const totalAllocated = budget.allocations.reduce((s, a) => s + a.amount, 0);
  const remaining = budget.startingBalance - totalAllocated - totalSpent;
  const usedPct = Math.min(100, Math.round(((totalAllocated + totalSpent) / budget.startingBalance) * 100));
  const isOver = remaining < 0;

  const diff = prevMonthTotal - totalSpent;
  const hasPrev = prevMonthTotal > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Monthly Performance</h2>
        <Link href="/settings" className="text-sm text-green-600 hover:underline font-medium">Update Budget →</Link>
      </div>

      {/* Budget usage bar */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-500">Budget Usage</span>
        <span className="text-sm font-semibold text-gray-700">{usedPct}% Used</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : "bg-green-400"}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Starting Balance</p>
          <p className="text-base font-bold text-gray-900">{fmt(budget.startingBalance)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Remaining</p>
          <p className={`text-base font-bold ${isOver ? "text-red-600" : "text-gray-900"}`}>{fmt(remaining)}</p>
        </div>
      </div>

      {/* Allocation + expenses list */}
      <div className="space-y-2 mb-4">
        {budget.allocations.map((a) => (
          <div key={a.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="text-sm text-gray-600">{a.label}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">{fmt(a.amount)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="text-sm text-gray-600">Expenses</span>
          </div>
          <span className="text-sm font-medium text-gray-900">{fmt(totalSpent)}</span>
        </div>
      </div>

      {/* Insight */}
      {hasPrev && (
        <div className={`rounded-xl p-3 ${diff >= 0 ? "bg-green-50" : "bg-red-50"}`}>
          <p className={`text-sm ${diff >= 0 ? "text-green-800" : "text-red-700"}`}>
            {diff >= 0 ? (
              <>You're tracking <strong>under budget</strong> by {fmt(diff)} compared to last month. Great job!</>
            ) : (
              <>You're spending <strong>{fmt(-diff)} more</strong> compared to last month.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
