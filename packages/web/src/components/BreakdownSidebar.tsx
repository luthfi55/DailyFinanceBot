import Link from "next/link";
import type { Category, Expense } from "@finance/db";

type CategoryBudget = { categoryId: string; amount: number };

type Props = {
  expenses: (Expense & { category: Category })[];
  categories: Category[];
  categoryBudgets: CategoryBudget[];
};

export function BreakdownSidebar({ expenses, categories, categoryBudgets }: Props) {
  const budgetMap: Record<string, number> = {};
  for (const b of categoryBudgets) budgetMap[b.categoryId] = b.amount;

  const items = categories
    .map((cat) => {
      const catExps = expenses.filter((e) => e.categoryId === cat.id);
      const spent = catExps.reduce((s, e) => s + e.amount, 0);
      const budget = budgetMap[cat.id] ?? 0;
      return { cat, spent, count: catExps.length, budget };
    })
    .filter((x) => x.spent > 0 || x.budget > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="font-bold text-gray-900 mb-4">Breakdown</h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No data this month.</p>
      ) : (
        <div className="space-y-4">
          {items.map(({ cat, spent, count, budget }) => {
            const hasBudget = budget > 0;
            const pct = hasBudget ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            const isOver = hasBudget && spent > budget;
            const spentK = spent >= 1_000_000
              ? `${(spent / 1_000_000).toFixed(1)}jt`
              : `${Math.round(spent / 1000)}k`;
            const budgetK = budget >= 1_000_000
              ? `${(budget / 1_000_000).toFixed(1)}jt`
              : `${Math.round(budget / 1000)}k`;

            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color ?? "#94a3b8" }}
                    />
                    <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    <span className="text-xs text-gray-400">{count} trx</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    Rp {spentK}{hasBudget ? ` / ${budgetK}` : ""}
                  </span>
                </div>
                {hasBudget && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : "bg-green-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/dashboard"
        className="block text-center text-[10px] font-semibold text-gray-400 hover:text-gray-600 mt-5 tracking-widest uppercase transition"
      >
        View Full Analysis
      </Link>
    </div>
  );
}
