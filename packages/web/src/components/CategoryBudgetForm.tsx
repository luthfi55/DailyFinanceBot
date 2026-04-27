"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@finance/db";

type CategoryBudget = { id: string; categoryId: string; amount: number };

type Props = {
  categories: Category[];
  budgets: CategoryBudget[];
  year: number;
  month: number;
};

export function CategoryBudgetForm({ categories, budgets, year, month }: Props) {
  const router = useRouter();

  const initial: Record<string, string> = {};
  for (const b of budgets) initial[b.categoryId] = b.amount.toString();

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  async function save(categoryId: string) {
    const amount = parseInt(values[categoryId] ?? "0") || 0;
    setSaving((s) => ({ ...s, [categoryId]: true }));

    await fetch("/api/budget/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, year, month, amount }),
    });

    setSaving((s) => ({ ...s, [categoryId]: false }));
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const val = values[cat.id] ?? "";
        const original = initial[cat.id] ?? "";
        const isDirty = val !== original;

        return (
          <div key={cat.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-700 w-32 shrink-0">{cat.name}</span>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-xs text-gray-400">Rp</span>
              <input
                type="number"
                value={val}
                onChange={(e) => setValues((v) => ({ ...v, [cat.id]: e.target.value }))}
                placeholder="No limit"
                min={0}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => save(cat.id)}
              disabled={saving[cat.id] || !isDirty}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 transition"
            >
              {saving[cat.id] ? "..." : "Save"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
