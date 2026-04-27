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
        <label className="block text-sm font-medium text-gray-700 mb-1">Starting Balance</label>
        <p className="text-xs text-gray-400 mb-2">Total money available this month (Rp)</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 6760000"
            min={0}
          />
          <button
            onClick={saveBalance}
            disabled={saving || !balance}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Fixed Allocations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Allocations</label>
        <p className="text-xs text-gray-400 mb-3">Money set aside before spending (savings, rent, etc.)</p>

        {allocations.length > 0 && (
          <div className="space-y-2 mb-3">
            {allocations.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{a.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{formatRupiah(a.amount)}</span>
                  <button
                    onClick={() => deleteAllocation(a.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new allocation */}
        {budgetId ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Savings"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Amount (Rp)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
            />
            <button
              onClick={addAllocation}
              disabled={adding || !newLabel || !newAmount}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 transition"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">Save your starting balance first to add allocations.</p>
        )}
      </div>
    </div>
  );
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
