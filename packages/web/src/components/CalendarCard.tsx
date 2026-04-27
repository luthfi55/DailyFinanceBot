"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MonthlyCalendar } from "./MonthlyCalendar";
import type { Category, Expense } from "@finance/db";

type Props = {
  expenses: (Expense & { category: Category })[];
  month: Date;
  year: number;
  monthNum: number;
};

export function CalendarCard({ expenses, month, year, monthNum }: Props) {
  const router = useRouter();

  function go(delta: number) {
    const d = new Date(year, monthNum - 1 + delta, 1);
    router.push(`/dashboard?year=${d.getFullYear()}&month=${d.getMonth() + 1}`);
  }

  const dayTotals: Record<number, number> = {};
  for (const exp of expenses) {
    const d = new Date(exp.date).getDate();
    dayTotals[d] = (dayTotals[d] ?? 0) + exp.amount;
  }
  const recentDays = Object.entries(dayTotals)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="font-semibold text-gray-900">{format(month, "MMMM yyyy")}</span>
        <div className="flex gap-0.5">
          <button onClick={() => go(-1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-base leading-none">‹</button>
          <button onClick={() => go(1)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-base leading-none">›</button>
        </div>
      </div>
      <MonthlyCalendar expenses={expenses} month={month} />
      {recentDays.length > 0 && (
        <div className="px-5 pb-4 pt-2 space-y-1.5 border-t border-gray-50">
          {recentDays.map(([day, total]) => (
            <div key={day} className="flex justify-between text-xs">
              <span className="text-gray-500">{format(month, "MMM")} {day} Spending</span>
              <span className="font-semibold text-gray-700">Rp {Number(total).toLocaleString("id-ID")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
