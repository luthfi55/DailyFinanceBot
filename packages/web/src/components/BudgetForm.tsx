"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Allocation = { id: string; label: string; amount: number; order: number };
type Budget = { id: string; startingBalance: number; allocations: Allocation[] } | null;

type Props = {
  budget: Budget;
  year: number;
  month: number;
};

export function BudgetForm({ budget: initial, year, month }: Props) {
  const router = useRouter();
  const [balance, setBalance] = useState(initial?.startingBalance?.toString() ?? "");
  const [allocations, setAllocations] = useState<Allocation[]>(initial?.allocations ?? []);
  const [budgetId, setBudgetId] = useState(initial?.id ?? "");
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function saveBalance() {
    if (!balance) return;
    setSaving(true);
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, startingBalance: parseInt(balance) }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setBudgetId(data.id);
      router.refresh();
    }
  }

  async function addAllocation() {
    if (!newLabel || !newAmount || !budgetId) return;
    setAdding(true);
    const res = await fetch("/api/budget/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgetId,
        label: newLabel,
        amount: parseInt(newAmount),
        order: allocations.length,
      }),
    });
    setAdding(false);
    if (res.ok) {
      const data = await res.json();
      setAllocations((prev) => [...prev, data]);
      setNewLabel("");
      setNewAmount("");
      setShowAddForm(false);
      router.refresh();
    }
  }

  async function deleteAllocation(id: string) {
    await fetch(`/api/budget/allocations/${id}`, { method: "DELETE" });
    setAllocations((prev) => prev.filter((a) => a.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Starting Balance */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Starting Balance</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
            <span className="text-gray-400 text-sm mr-1.5">Rp</span>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="outline-none text-sm text-gray-900 bg-transparent w-full"
              placeholder="0"
              min={0}
            />
          </div>
          <button
            onClick={saveBalance}
            disabled={saving || !balance}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Fixed Allocations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800">Fixed Allocations</span>
          {budgetId && (
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add New
            </button>
          )}
        </div>

        {allocations.length > 0 && (
          <div className="space-y-2 mb-3">
            {allocations.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 bg-indigo-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.label}</p>
                    <p className="text-xs text-gray-400">Fixed allocation</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{formatRupiah(a.amount)}</span>
                  <button
                    onClick={() => deleteAllocation(a.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddForm && budgetId && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Savings)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Amount"
              className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
            />
            <button
              onClick={addAllocation}
              disabled={adding || !newLabel || !newAmount}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {adding ? "..." : "Add"}
            </button>
          </div>
        )}

        {!budgetId && (
          <p className="text-xs text-gray-400 italic">Save your starting balance first to add allocations.</p>
        )}
      </div>
    </div>
  );
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
