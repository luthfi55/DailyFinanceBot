"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Category, Expense } from "@finance/db";

type ExpenseWithCategory = Expense & { category: Category };

export function ExpenseList({ expenses }: { expenses: ExpenseWithCategory[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-8 text-center">No expenses found.</p>
    );
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="divide-y divide-gray-50">
        {expenses.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0 text-left w-20">
                <div className="text-xs text-gray-500">{format(new Date(exp.date), "dd MMM yyyy")}</div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: exp.category.color ?? "#94a3b8" }}
                />
                <span className="text-sm text-gray-700 font-medium">{exp.category.name}</span>
                {exp.note && (
                  <span className="text-xs text-gray-400">{exp.note}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-900">
                {formatRupiah(exp.amount)}
              </span>
              <button
                onClick={() => handleDelete(exp.id)}
                disabled={deletingId === exp.id}
                title="Delete"
                className="text-red-400 hover:text-red-600 transition disabled:opacity-50"
              >
                {deletingId === exp.id ? (
                  <span className="text-xs">...</span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-2xl">
        <span className="text-xs text-gray-500">{expenses.length} transaction{expenses.length !== 1 ? "s" : ""}</span>
        <span className="text-sm font-semibold text-gray-900">{formatRupiah(total)}</span>
      </div>
    </div>
  );
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
