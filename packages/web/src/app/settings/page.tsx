import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CategoryManager } from "@/components/CategoryManager";
import { PhoneVerification } from "@/components/PhoneVerification";
import { BudgetForm } from "@/components/BudgetForm";
import { CategoryBudgetForm } from "@/components/CategoryBudgetForm";
import { MonthNav } from "@/components/MonthNav";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;

  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;

  const monthDate = new Date(year, month - 1, 1);

  let categories = await prisma.category.findMany({
    where: { userId, year, month },
    orderBy: { name: "asc" },
  });
  if (categories.length === 0) {
    categories = await prisma.category.findMany({
      where: { userId, year: 0, month: 0 },
      orderBy: { name: "asc" },
    });
  }

  const [user, budget, categoryBudgets, expenses] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { phoneNumber: true, isVerified: true } }),
    prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: { allocations: { orderBy: { order: "asc" } } },
    }),
    prisma.categoryBudget.findMany({ where: { userId, year, month } }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: startOfMonth(monthDate), lte: endOfMonth(monthDate) },
      },
      select: { amount: true },
    }),
  ]);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const startingBalance = budget?.startingBalance ?? 0;
  const efficiencyRate = startingBalance > 0
    ? Math.min(100, Math.round(((startingBalance - totalSpent) / startingBalance) * 100))
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your budget, categories, and WhatsApp number</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">
        {/* Left column */}
        <div className="space-y-5">
          {/* Monthly Budget */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <MonthNav year={year} month={month} basePath="/settings" />
              <span className="text-xs font-semibold tracking-widest text-gray-400 border border-gray-200 rounded-full px-3 py-1 uppercase shrink-0">
                Planning
              </span>
            </div>
            <BudgetForm key={`budget-${year}-${month}`} budget={budget} year={year} month={month} />
          </div>

          {/* Category Budgets */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Category Budgets</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(monthDate, "MMMM yyyy")} — set limit per category (leave empty for no limit)
              </p>
            </div>
            <CategoryBudgetForm
              key={`catbudget-${year}-${month}`}
              categories={categories}
              budgets={categoryBudgets}
              year={year}
              month={month}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* WhatsApp Sync */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">WhatsApp Sync</h2>
                <p className="text-xs text-gray-400 mt-0.5">Real-time expense notifications</p>
              </div>
            </div>
            <PhoneVerification
              phone={user?.phoneNumber ?? null}
              isVerified={user?.isVerified ?? false}
            />
          </div>

          {/* Manage Categories */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Manage Categories</h2>
            <CategoryManager categories={categories} year={year} month={month} />
          </div>

          {/* Budget Health */}
          {startingBalance > 0 && efficiencyRate !== null && (
            <div className="bg-gray-900 rounded-2xl p-5 text-white">
              <h2 className="font-semibold text-base mb-1">Budget Health</h2>
              <p className="text-xs text-gray-400 mb-4">
                {efficiencyRate >= 50
                  ? "You're spending within budget. Keep it up!"
                  : "You're close to your budget limit this month."}
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.max(0, efficiencyRate)}%`,
                    backgroundColor: efficiencyRate >= 50 ? "#22c55e" : "#f97316",
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Efficiency Rate</span>
                <span
                  className="text-sm font-bold"
                  style={{ color: efficiencyRate >= 50 ? "#22c55e" : "#f97316" }}
                >
                  {efficiencyRate}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
