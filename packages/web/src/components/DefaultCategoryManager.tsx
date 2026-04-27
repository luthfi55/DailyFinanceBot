"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DefaultCategory } from "@finance/db";

const COLOR_OPTIONS = [
  "#f97316", "#3b82f6", "#a855f7", "#22c55e",
  "#ef4444", "#eab308", "#6b7280", "#111827",
  "#ec4899", "#92400e",
];

export function DefaultCategoryManager({ categories }: { categories: DefaultCategory[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[1]);
  const [showColors, setShowColors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addCategory() {
    if (!newName.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/default-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to add");
    } else {
      setNewName("");
      setShowColors(false);
      router.refresh();
    }
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/admin/default-categories/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function exportSchema() {
    const data = categories.map((c) => ({ name: c.name, color: c.color }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "category-schema.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <h2 className="font-bold text-gray-900 text-lg">Default Categories</h2>
        </div>
        <span className="text-sm font-medium text-blue-600 cursor-default">Manage Rules</span>
      </div>

      {/* Create form */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Create New Category
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Category Name (e.g. Health)"
          />
          {/* Color picker trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColors((v) => !v)}
              className="w-9 h-9 rounded-full border-2 border-white shadow-md shrink-0 transition hover:scale-110"
              style={{ backgroundColor: newColor }}
            />
            {showColors && (
              <div className="absolute right-0 top-11 bg-white border border-gray-100 rounded-xl shadow-lg p-2 z-10 flex flex-wrap gap-1.5 w-[120px]">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setNewColor(c); setShowColors(false); }}
                    className={`w-6 h-6 rounded-full transition hover:scale-110 ${newColor === c ? "ring-2 ring-offset-1 ring-blue-400" : ""}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Add button */}
          <button
            onClick={addCategory}
            disabled={loading || !newName.trim()}
            className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-gray-700 disabled:opacity-50 transition shrink-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* Global presets list */}
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Global Presets
        </p>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color ?? "#94a3b8" }}
                />
                <span className="text-base font-semibold text-gray-900">{cat.name}</span>
              </div>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-gray-400">No default categories yet.</p>
          )}
        </div>
      </div>

      {/* Export */}
      {categories.length > 0 && (
        <button
          onClick={exportSchema}
          className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 border-t border-gray-100 pt-4 transition"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Category Schema
        </button>
      )}
    </div>
  );
}
