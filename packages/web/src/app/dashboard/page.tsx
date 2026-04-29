import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma, ensureCategoriesForMonth } from "@finance/db";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MonthlyPerformance } from "@/components/MonthlyPerformance";
import { RecentActivity } from "@/components/RecentActivity";
import { BreakdownSidebar } from "@/components/BreakdownSidebar";
import { AddExpenseCard } from "@/components/AddExpenseCard";
import { CalendarCard } from "@/components/CalendarCard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;

  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const monthDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const prevMonth = subMonths(monthDate, 1);

  await ensureCategoriesForMonth(userId, year, month);
  const categories = await prisma.category.findMany({
    where: { userId, year, month },
    orderBy: { name: "asc" },
  });

  const [expenses, budget, categoryBudgets, prevAgg] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: { allocations: { orderBy: { order: "asc" } } },
    }),
    prisma.categoryBudget.findMany({ where: { userId, year, month } }),
    prisma.expense.aggregate({
      where: {
        userId,
        date: { gte: startOfMonth(prevMonth), lte: endOfMonth(prevMonth) },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalMonth = expenses.reduce((sum, e) => sum + e.amount, 0);
  const prevMonthTotal = prevAgg._sum.amount ?? 0;
  const daysElapsed = isCurrentMonth ? now.getDate() : monthEnd.getDate();
  const avgPerDay = daysElapsed > 0 ? Math.round(totalMonth / daysElapsed) : 0;

  const diffPct =
    prevMonthTotal > 0
      ? Math.round((Math.abs(prevMonthTotal - totalMonth) / prevMonthTotal) * 100)
      : null;
  const isLess = prevMonthTotal > totalMonth;

  return (
    <div>
      <DashboardHeader year={year} month={month} />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-5 items-start">
        {/* Left column */}
        <div className="md:col-span-3 space-y-4 md:space-y-5">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Spending */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                {isCurrentMonth && (
                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    Current Month
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-1">Total Spending</p>
              <p className="text-xl font-bold text-gray-900">{fmt(totalMonth)}</p>
              {diffPct !== null && (
                <p className="text-xs mt-1">
                  {isLess ? (
                    <span className="text-green-600">↓ {diffPct}% less than last month</span>
                  ) : (
                    <span className="text-red-500">↑ {diffPct}% more than last month</span>
                  )}
                </p>
              )}
            </div>

            {/* Avg/Day — dark */}
            <div className="bg-gray-900 rounded-2xl p-4">
              <p className="text-xs text-gray-400 mb-2">Avg/Day Spending</p>
              <p className="text-xl font-bold text-white mb-4">{fmt(avgPerDay)}</p>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: "35%" }} />
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Total Transactions</p>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{expenses.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">items</p>
            </div>
          </div>

          <MonthlyPerformance budget={budget} totalSpent={totalMonth} prevMonthTotal={prevMonthTotal} />
          <RecentActivity expenses={expenses.slice(0, 5)} />
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-4 md:space-y-5">
          <CalendarCard expenses={expenses} month={monthDate} year={year} monthNum={month} />
          {isCurrentMonth && <AddExpenseCard categories={categories} />}
          <BreakdownSidebar expenses={expenses} categories={categories} categoryBudgets={categoryBudgets} />
        </div>
      </div>
    </div>
  );
}

function fmt(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}
