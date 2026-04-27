import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { MonthlyBreakdown } from "@/components/MonthlyBreakdown";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { BudgetSummary } from "@/components/BudgetSummary";
import { AddExpenseForm } from "@/components/AddExpenseForm";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [expenses, categories, budget, categoryBudgets] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: { allocations: { orderBy: { order: "asc" } } },
    }),
    prisma.categoryBudget.findMany({
      where: { userId, year, month },
    }),
  ]);

  const totalMonth = expenses.reduce((sum, e) => sum + e.amount, 0);
  const daysElapsed = now.getDate();
  const avgPerDay = daysElapsed > 0 ? Math.round(totalMonth / daysElapsed) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{format(now, "MMMM yyyy")}</h1>
        <p className="text-sm text-gray-400 mt-0.5">Monthly spending overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Spending" value={formatRupiah(totalMonth)} />
        <StatCard label="Transactions" value={`${expenses.length}`} />
        <StatCard label="Avg / Day" value={formatRupiah(avgPerDay)} />
      </div>

      {/* Add Expense */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Expense</h2>
        <AddExpenseForm categories={categories} />
      </div>

      {/* Budget Summary */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Budget</h2>
            <p className="text-xs text-gray-400 mt-0.5">{format(now, "MMMM yyyy")}</p>
          </div>
        </div>
        <BudgetSummary budget={budget} totalSpent={totalMonth} />
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Calendar</h2>
          <p className="text-xs text-gray-400 mt-0.5">{format(now, "MMMM yyyy")}</p>
        </div>
        <MonthlyCalendar expenses={expenses} month={now} />
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Monthly Breakdown</h2>
          <p className="text-xs text-gray-400 mt-0.5">{format(now, "MMMM yyyy")}</p>
        </div>
        <MonthlyBreakdown expenses={expenses} categories={categories} categoryBudgets={categoryBudgets} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
