"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

export function MonthNav({
  year,
  month,
  basePath = "/dashboard",
}: {
  year: number;
  month: number;
  basePath?: string;
}) {
  const router = useRouter();

  function go(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    router.push(`${basePath}?year=${d.getFullYear()}&month=${d.getMonth() + 1}`);
  }

  const label = format(new Date(year, month - 1, 1), "MMMM yyyy");

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(-1)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition text-sm"
      >
        ←
      </button>
      <span className="text-2xl font-bold text-gray-900 min-w-[180px] text-center">{label}</span>
      <button
        onClick={() => go(1)}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition text-sm"
      >
        →
      </button>
    </div>
  );
}
