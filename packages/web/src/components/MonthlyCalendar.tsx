"use client";

import { getDaysInMonth, format, getDay, startOfMonth } from "date-fns";
import type { Category, Expense } from "@finance/db";

type Props = {
  expenses: (Expense & { category: Category })[];
  month: Date;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthlyCalendar({ expenses, month }: Props) {
  const daysInMonth = getDaysInMonth(month);
  const firstDayOfWeek = getDay(startOfMonth(month)); // 0=Sun, 1=Mon, ...
  // Convert to Mon-based index (Mon=0 ... Sun=6)
  const startOffset = (firstDayOfWeek + 6) % 7;

  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === month.getMonth() &&
    today.getFullYear() === month.getFullYear();

  // Build day totals map: day -> total amount
  const dayTotals: Record<number, number> = {};
  for (const exp of expenses) {
    const d = new Date(exp.date).getDate();
    dayTotals[d] = (dayTotals[d] ?? 0) + exp.amount;
  }

  const maxAmount = Math.max(0, ...Object.values(dayTotals));

  // Build grid cells: nulls for blank slots, then day numbers
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="p-5">
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={di} />;
              }

              const amount = dayTotals[day] ?? 0;
              const isToday = isCurrentMonth && today.getDate() === day;
              const intensity = maxAmount > 0 ? amount / maxAmount : 0;

              return (
                <div
                  key={di}
                  className={`
                    relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-lg min-h-[52px]
                    ${isToday ? "ring-2 ring-blue-400" : ""}
                    ${amount > 0 ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}
                    transition
                  `}
                  style={
                    amount > 0 && intensity > 0
                      ? { backgroundColor: `rgba(59,130,246,${0.06 + intensity * 0.22})` }
                      : undefined
                  }
                >
                  <span
                    className={`text-xs font-semibold ${
                      isToday
                        ? "text-blue-600"
                        : amount > 0
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {day}
                  </span>
                  {amount > 0 && (
                    <span className="text-[10px] font-medium text-blue-600 mt-0.5 leading-tight text-center px-0.5">
                      {formatShort(amount)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}
