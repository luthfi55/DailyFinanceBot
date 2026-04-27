"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@finance/db";

type Props = {
  categories: Category[];
  year: number;
  month: number;
  categoryId: string;
  budget: { startingBalance: number } | null;
  totalSpent: number;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ExpenseFilters({ categories, year, month, categoryId, budget, totalSpent }: Props) {
  const router = useRouter();

  function update(params: Partial<{ year: number; month: number; categoryId: string }>) {
    const next = { year, month, categoryId, ...params };
    const qs = new URLSearchParams();
    if (next.year) qs.set("year", String(next.year));
    if (next.month) qs.set("month", String(next.month));
    if (next.categoryId) qs.set("categoryId", next.categoryId);
    router.push(`/dashboard/expenses?${qs.toString()}`);
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  const spentPct = budget?.startingBalance
    ? Math.min(100, Math.round((totalSpent / budget.startingBalance) * 100))
    : 0;

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Dropdowns */}
      <div className="flex flex-wrap gap-4 flex-1">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Year
          </label>
          <div className="relative">
            <select
              value={year || ""}
              onChange={(e) => update({ year: Number(e.target.value) || 0, month: 0 })}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Chevron />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Month
          </label>
          <div className="relative">
            <select
              value={month || ""}
              onChange={(e) => update({ month: Number(e.target.value) || 0 })}
              disabled={!year}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 min-w-[140px]"
            >
              <option value="">All months</option>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <Chevron />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
            Category
          </label>
          <div className="relative">
            <select
              value={categoryId || ""}
              onChange={(e) => update({ categoryId: e.target.value })}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Chevron />
          </div>
        </div>

        {(year || month || categoryId) && (
          <div className="self-end pb-2.5">
            <button
              onClick={() => router.push("/dashboard/expenses")}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Monthly Budget card */}
      {budget && (
        <div className="bg-gray-900 text-white rounded-2xl px-5 py-4 min-w-[210px]">
          <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1">
            Monthly Budget
          </p>
          <p className="text-2xl font-bold mb-3">
            Rp {budget.startingBalance.toLocaleString("id-ID")}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${spentPct}%`,
                backgroundColor: spentPct >= 90 ? "#ef4444" : "#22c55e",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
