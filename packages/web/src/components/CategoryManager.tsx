"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@finance/db";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addCategory() {
    if (!newName.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to add category");
    } else {
      setNewName("");
      router.refresh();
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? All related expenses will also be deleted.")) return;

    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="food, transport, ..."
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color</label>
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-9 w-12 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <button
          onClick={addCategory}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Add
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cat.color ?? "#94a3b8" }}
              />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </div>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="text-xs text-red-400 hover:text-red-600 transition"
            >
              Delete
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-gray-400">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
