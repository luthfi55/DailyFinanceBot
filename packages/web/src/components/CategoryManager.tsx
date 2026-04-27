"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@finance/db";

export function CategoryManager({
  categories,
  year = 0,
  month = 0,
}: {
  categories: Category[];
  year?: number;
  month?: number;
}) {
  const COLOR_OPTIONS = [
    { label: "green",  hex: "#22c55e" },
    { label: "blue",   hex: "#3b82f6" },
    { label: "red",    hex: "#ef4444" },
    { label: "indigo", hex: "#818cf8" },
    { label: "black",  hex: "#111827" },
    { label: "orange", hex: "#f97316" },
    { label: "yellow", hex: "#eab308" },
    { label: "purple", hex: "#a855f7" },
    { label: "pink",   hex: "#ec4899" },
    { label: "brown",  hex: "#92400e" },
  ];

  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].hex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addCategory() {
    if (!newName.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor, year, month }),
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
      {/* Add category form */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Category Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Health"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Label Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setNewColor(c.hex)}
                  className={`w-6 h-6 rounded-md transition ${newColor === c.hex ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={addCategory}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition"
        >
          {loading ? "Adding..." : "Add Category"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Category list */}
      <div className="space-y-1">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between px-3 py-3 hover:bg-gray-50 rounded-lg transition"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color ?? "#94a3b8" }}
              />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </div>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="text-gray-400 hover:text-red-500 transition"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" /><path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 px-3">No categories for this month.</p>
        )}
      </div>
    </div>
  );
}
