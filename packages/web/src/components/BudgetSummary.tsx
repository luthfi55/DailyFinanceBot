type Allocation = { id: string; label: string; amount: number };
type Budget = { startingBalance: number; allocations: Allocation[] } | null;

type Props = {
  budget: Budget;
  totalSpent: number;
};

export function BudgetSummary({ budget, totalSpent }: Props) {
  if (!budget || budget.startingBalance === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-sm text-gray-400">No budget set for this month.</p>
        <p className="text-xs text-gray-300 mt-1">Go to Settings → Monthly Budget to set it up.</p>
      </div>
    );
  }

  const totalAllocated = budget.allocations.reduce((s, a) => s + a.amount, 0);
  const remaining = budget.startingBalance - totalAllocated - totalSpent;
  const isNegative = remaining < 0;

  return (
    <div className="p-5 space-y-3">
      {/* Starting balance */}
      <div className="flex justify-between items-center py-2">
        <span className="text-sm font-semibold text-gray-800">Starting Balance</span>
        <span className="text-sm font-bold text-gray-900">{formatRupiah(budget.startingBalance)}</span>
      </div>

      <div className="border-t border-gray-100" />

      {/* Fixed allocations */}
      {budget.allocations.map((a) => (
        <div key={a.id} className="flex justify-between items-center">
          <span className="text-sm text-gray-500">− {a.label}</span>
          <span className="text-sm text-gray-700">{formatRupiah(a.amount)}</span>
        </div>
      ))}

      {/* Spending */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">− Expenses</span>
        <span className="text-sm text-gray-700">{formatRupiah(totalSpent)}</span>
      </div>

      <div className="border-t border-gray-200" />

      {/* Remaining */}
      <div className="flex justify-between items-center py-1">
        <span className="text-sm font-bold text-gray-800">Remaining</span>
        <span className={`text-lg font-bold ${isNegative ? "text-red-600" : "text-green-600"}`}>
          {formatRupiah(remaining)}
        </span>
      </div>

      {/* Progress bar */}
      {budget.startingBalance > 0 && (
        <div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isNegative ? "bg-red-400" : "bg-green-400"}`}
              style={{
                width: `${Math.min(100, ((totalAllocated + totalSpent) / budget.startingBalance) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {Math.round(((totalAllocated + totalSpent) / budget.startingBalance) * 100)}% used
          </p>
        </div>
      )}
    </div>
  );
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
