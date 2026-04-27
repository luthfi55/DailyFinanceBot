import { format } from "date-fns";
import Link from "next/link";
import type { Category, Expense } from "@finance/db";

type Props = {
  expenses: (Expense & { category: Category })[];
};

export function RecentActivity({ expenses }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Recent Activity</h2>
        <Link href="/dashboard/expenses" className="text-xs text-gray-400 hover:text-gray-600 transition">
          View all →
        </Link>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-gray-400 p-5 text-center">No transactions yet.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Transaction</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Note</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-5 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: exp.category.color ?? "#94a3b8" }}
                    >
                      {exp.category.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{exp.category.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-400">{exp.note ?? "—"}</td>
                <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {format(new Date(exp.date), "dd MMM yyyy")}
                </td>
                <td className="px-5 py-3 text-sm font-semibold text-red-500 text-right whitespace-nowrap">
                  Rp {exp.amount.toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
