"use client";

import { useRouter } from "next/navigation";
import type { Category } from "@finance/db";

type Props = {
  categories: Category[];
  year: number;
  month: number;
  categoryId: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function ExpenseFilters({ categories, year, month, categoryId }: Props) {
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

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Year</label>
        <select
          value={year || ""}
          onChange={(e) => update({ year: Number(e.target.value) || 0, month: 0 })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Month</label>
        <select
          value={month || ""}
          onChange={(e) => update({ month: Number(e.target.value) || 0 })}
          disabled={!year}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">All months</option>
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Category</label>
        <select
          value={categoryId || ""}
          onChange={(e) => update({ categoryId: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {(year || month || categoryId) && (
        <div className="mt-4">
          <button
            onClick={() => router.push("/dashboard/expenses")}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
