"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { Category, Expense } from "@finance/db";

type ExpenseWithCategory = Expense & { category: Category };

const PAGE_SIZE = 10;

export function ExpenseList({ expenses }: { expenses: ExpenseWithCategory[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(expenses.length / PAGE_SIZE);
  const paginated = expenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setMenuOpenId(null);
    setDeletingId(id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  function exportCSV() {
    const rows = [
      ["Date", "Category", "Note", "Amount"],
      ...expenses.map((e) => [
        format(new Date(e.date), "yyyy-MM-dd"),
        e.category.name,
        e.note ?? "",
        e.amount.toString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (expenses.length === 0) {
    return (
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-base">Recent Transactions</h2>
        <p className="text-sm text-gray-400 py-8 text-center w-full">No expenses found.</p>
      </div>
    );
  }

  return (
    <div onClick={() => setMenuOpenId(null)}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-base">Recent Transactions</h2>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition"
        >
          Export CSV
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {paginated.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition"
          >
            {/* Category icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: exp.category.color ?? "#94a3b8" }}
            >
              {exp.category.name[0].toUpperCase()}
            </div>

            {/* Name + subtitle */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {exp.note || exp.category.name}
              </p>
              {exp.note && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{exp.category.name}</p>
              )}
            </div>

            {/* Badge + date */}
            <div className="text-center shrink-0 hidden sm:block">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {exp.category.name}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {format(new Date(exp.date), "MMM dd, yyyy")}
              </p>
            </div>

            {/* Amount */}
            <span className="text-sm font-bold text-gray-900 min-w-[110px] text-right shrink-0">
              -{formatRupiah(exp.amount)}
            </span>

            {/* Three-dot menu */}
            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpenId(menuOpenId === exp.id ? null : exp.id)}
                className="text-gray-300 hover:text-gray-500 transition p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>

              {menuOpenId === exp.id && (
                <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-10 min-w-[120px] py-1 overflow-hidden">
                  <button
                    onClick={() => handleDelete(exp.id)}
                    disabled={deletingId === exp.id}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    {deletingId === exp.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, expenses.length)} of {expenses.length} transactions
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="text-sm px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
