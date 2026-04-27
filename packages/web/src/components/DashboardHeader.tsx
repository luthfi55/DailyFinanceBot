"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

export function DashboardHeader({ year, month }: { year: number; month: number }) {
  const router = useRouter();

  function go(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    router.push(`/dashboard?year=${d.getFullYear()}&month=${d.getMonth() + 1}`);
  }

  const label = format(new Date(year, month - 1, 1), "MMMM yyyy").toUpperCase();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search transactions..."
          className="pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
      </div>

      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <button onClick={() => go(-1)} className="px-1 text-gray-400 hover:text-gray-700 text-sm">‹</button>
        <span className="text-xs font-semibold text-gray-700 min-w-[100px] text-center">{label}</span>
        <button onClick={() => go(1)} className="px-1 text-gray-400 hover:text-gray-700 text-sm">›</button>
      </div>
    </div>
  );
}
