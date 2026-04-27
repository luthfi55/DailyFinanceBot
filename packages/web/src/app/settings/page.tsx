import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";
import { format } from "date-fns";
import { CategoryManager } from "@/components/CategoryManager";
import { PhoneVerification } from "@/components/PhoneVerification";
import { BudgetForm } from "@/components/BudgetForm";
import { CategoryBudgetForm } from "@/components/CategoryBudgetForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [categories, user, budget, categoryBudgets] = await Promise.all([
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
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

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Monthly Budget</h2>
        <p className="text-xs text-gray-400 mb-4">{format(now, "MMMM yyyy")}</p>
        <BudgetForm budget={budget} year={year} month={month} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Category Budgets</h2>
        <p className="text-xs text-gray-400 mb-4">{format(now, "MMMM yyyy")} — set limit per category (leave empty for no limit)</p>
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
        <h2 className="font-semibold text-gray-800 mb-4">Expense Categories</h2>
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
