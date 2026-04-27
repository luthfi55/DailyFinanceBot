"use client";

import { getDaysInMonth, format } from "date-fns";
import type { Category, Expense } from "@finance/db";

type Props = {
  expenses: (Expense & { category: Category })[];
  categories: Category[];
  month: Date;
};

export function WeeklyTable({ expenses, categories, month }: Props) {
  const daysInMonth = getDaysInMonth(month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const weeks: number[][] = [];
  let currentWeek: number[] = [];

  for (const day of days) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    if (currentWeek.length > 0 && date.getDay() === 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getAmount = (categoryId: string, day: number) => {
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return e.categoryId === categoryId && d.getDate() === day;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const getWeeklyTotal = (week: number[]) =>
    expenses
      .filter((e) => {
        const d = new Date(e.date);
        return week.includes(d.getDate());
      })
      .reduce((sum, e) => sum + e.amount, 0);

  const getCategoryWeeklyTotal = (categoryId: string, week: number[]) =>
    expenses
      .filter((e) => {
        const d = new Date(e.date);
        return e.categoryId === categoryId && week.includes(d.getDate());
      })
      .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="overflow-x-auto">
      {weeks.map((week, wi) => (
        <div key={wi} className="mb-0">
          <table className="w-full text-xs border-b border-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 text-gray-500 font-medium w-28">
                  Minggu {wi + 1}
                </th>
                {week.map((day) => (
                  <th key={day} className="px-2 py-2 text-center text-gray-500 font-medium">
                    <div>{format(new Date(month.getFullYear(), month.getMonth(), day), "EEE")}</div>
                    <div className="font-bold text-gray-700">{day}</div>
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-gray-500 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const weekTotal = getCategoryWeeklyTotal(cat.id, week);
                if (weekTotal === 0 && weeks.length > 1) return null;
                return (
                  <tr key={cat.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-600 font-medium">{cat.name}</td>
                    {week.map((day) => {
                      const amount = getAmount(cat.id, day);
                      return (
                        <td key={day} className="px-2 py-2 text-center text-gray-600">
                          {amount > 0 ? formatShort(amount) : ""}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right font-medium text-gray-700">
                      {weekTotal > 0 ? formatShort(weekTotal) : ""}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-gray-200 bg-blue-50">
                <td className="px-3 py-2 font-bold text-blue-700">Week Total</td>
                {week.map((day) => {
                  const dayTotal = expenses
                    .filter((e) => new Date(e.date).getDate() === day)
                    .reduce((sum, e) => sum + e.amount, 0);
                  return (
                    <td key={day} className="px-2 py-2 text-center font-semibold text-blue-700">
                      {dayTotal > 0 ? formatShort(dayTotal) : ""}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right font-bold text-blue-700">
                  {formatShort(getWeeklyTotal(week))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function formatShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}
