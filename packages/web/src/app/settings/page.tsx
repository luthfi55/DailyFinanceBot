import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";
import { format } from "date-fns";
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

  const [user, budget, categoryBudgets] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { phoneNumber: true, isVerified: true } }),
    prisma.monthlyBudget.findUnique({
      where: { userId_year_month: { userId, year, month } },
      include: { allocations: { orderBy: { order: "asc" } } },
    }),
    prisma.categoryBudget.findMany({ where: { userId, year, month } }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your budget, categories, and WhatsApp number</p>
      </div>

      {/* Month navigation — only for budget sections */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Monthly Budget</h2>
            <p className="text-xs text-gray-400 mt-0.5">{format(monthDate, "MMMM yyyy")}</p>
          </div>
          <MonthNav year={year} month={month} basePath="/settings" />
        </div>
        <BudgetForm budget={budget} year={year} month={month} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800">Category Budgets</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(monthDate, "MMMM yyyy")} — set limit per category (leave empty for no limit)
          </p>
        </div>
        <CategoryBudgetForm
          categories={categories}
          budgets={categoryBudgets}
          year={year}
          month={month}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">WhatsApp Number</h2>
        <PhoneVerification
          phone={user?.phoneNumber ?? null}
          isVerified={user?.isVerified ?? false}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800">Expense Categories</h2>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">
          {format(monthDate, "MMMM yyyy")}
          {year === 0 ? " — global (applies to all months)" : ""}
        </p>
        <CategoryManager categories={categories} year={year} month={month} />
      </div>
    </div>
  );
}
