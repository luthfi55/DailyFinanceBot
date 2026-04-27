"use client";

import { format } from "date-fns";
import type { Category, Expense } from "@finance/db";

type CategoryBudget = { categoryId: string; amount: number };

type Props = {
  expenses: (Expense & { category: Category })[];
  categories: Category[];
  categoryBudgets: CategoryBudget[];
};

export function MonthlyBreakdown({ expenses, categories, categoryBudgets }: Props) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const budgetMap: Record<string, number> = {};
  for (const b of categoryBudgets) budgetMap[b.categoryId] = b.amount;

  const categoryTotals = categories
    .map((cat) => {
      const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
      const spent = catExpenses.reduce((s, e) => s + e.amount, 0);
      const budget = budgetMap[cat.id] ?? 0;
      return { cat, spent, count: catExpenses.length, budget };
    })
    .filter((x) => x.spent > 0 || x.budget > 0)
    .sort((a, b) => b.spent - a.spent);

  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="divide-y divide-gray-100">
      {/* Category Summary */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">By Category</h3>
        {categoryTotals.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No expenses this month</p>
        ) : (
          <div className="space-y-4">
            {categoryTotals.map(({ cat, spent, count, budget }) => {
              const hasBudget = budget > 0;
              const pctOfTotal = total > 0 ? Math.round((spent / total) * 100) : 0;
              const pctOfBudget = hasBudget ? Math.round((spent / budget) * 100) : 0;
              const isOver = hasBudget && spent > budget;

              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                      <span className="text-xs text-gray-400">
                        {count} transaction{count !== 1 ? "s" : ""}
                      </span>
                      {isOver && (
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                          Over budget
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${isOver ? "text-red-600" : "text-gray-900"}`}>
                        {formatRupiah(spent)}
                      </span>
                      {hasBudget && (
                        <span className="text-xs text-gray-400 ml-1">/ {formatRupiah(budget)}</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    {hasBudget ? (
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(100, pctOfBudget)}%` }}
                      />
                    ) : (
                      <div
                        className="h-full bg-blue-300 rounded-full"
                        style={{ width: `${pctOfTotal}%` }}
                      />
                    )}
                  </div>

                  <div className="flex justify-between mt-0.5">
                    {hasBudget ? (
                      <>
                        <span className={`text-[10px] ${isOver ? "text-red-400" : "text-gray-400"}`}>
                          {pctOfBudget}% of budget
                        </span>
                        {!isOver && (
                          <span className="text-[10px] text-gray-400">
                            {formatRupiah(budget - spent)} left
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400">{pctOfTotal}% of total</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Transactions</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No transactions yet</p>
        ) : (
          <div className="space-y-1">
            {sorted.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg border-b border-gray-50 last:border-0 hover:bg-gray-50 transition cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 text-left w-16">
                    <div className="text-xs text-gray-500">{format(new Date(exp.date), "dd MMM")}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-700 font-medium">{exp.category.name}</span>
                    {exp.note && (
                      <span className="text-xs text-gray-400 ml-2">{exp.note}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatRupiah(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
