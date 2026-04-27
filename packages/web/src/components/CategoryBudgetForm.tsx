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
    <div className="space-y-3">
      {categories.map((cat) => {
        const val = values[cat.id] ?? "";
        const original = initial[cat.id] ?? "";
        const isDirty = val !== original;

        return (
          <div key={cat.id} className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{cat.name}</label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border border-gray-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                <span className="text-gray-400 text-sm mr-1.5">Rp</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => setValues((v) => ({ ...v, [cat.id]: e.target.value }))}
                  placeholder="No limit"
                  min={0}
                  className="outline-none text-sm text-gray-900 bg-transparent w-full"
                />
              </div>
              <button
                onClick={() => save(cat.id)}
                disabled={saving[cat.id] || !isDirty}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 transition"
              >
                {saving[cat.id] ? "..." : "Save"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
