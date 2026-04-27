"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DefaultCategory } from "@finance/db";

export function DefaultCategoryManager({ categories }: { categories: DefaultCategory[] }) {
  const router = useRouter();
  const COLOR_OPTIONS = [
    { label: "blue",   hex: "#3b82f6" },
    { label: "green",  hex: "#22c55e" },
    { label: "red",    hex: "#ef4444" },
    { label: "orange", hex: "#f97316" },
    { label: "yellow", hex: "#eab308" },
    { label: "brown",  hex: "#92400e" },
    { label: "gray",   hex: "#6b7280" },
    { label: "black",  hex: "#111827" },
    { label: "pink",   hex: "#ec4899" },
    { label: "purple", hex: "#a855f7" },
  ];

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0].hex);
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
      router.refresh();
    }
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/admin/default-categories/${id}`, { method: "DELETE" });
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
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.label}
                onClick={() => setNewColor(c.hex)}
                className="w-6 h-6 rounded-full border-2 transition"
                style={{
                  backgroundColor: c.hex,
                  borderColor: newColor === c.hex ? "#1e40af" : "transparent",
                  outline: newColor === c.hex ? "2px solid #93c5fd" : "none",
                }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={addCategory}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition"
        >
          Add
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100"
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
          <p className="text-sm text-gray-400">No default categories yet.</p>
        )}
      </div>
    </div>
  );
}
