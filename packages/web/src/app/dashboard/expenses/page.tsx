import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";
import { startOfMonth, endOfMonth } from "date-fns";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { ExpenseList } from "@/components/ExpenseList";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; categoryId?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;

  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year) : now.getFullYear();
  const month = searchParams.month ? parseInt(searchParams.month) : now.getMonth() + 1;
  const categoryId = searchParams.categoryId ?? "";

  const dateFilter =
    year && month
      ? { gte: startOfMonth(new Date(year, month - 1)), lte: endOfMonth(new Date(year, month - 1)) }
      : year
      ? { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59) }
      : undefined;

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        ...(dateFilter ? { date: dateFilter } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <p className="text-sm text-gray-400 mt-0.5">All transactions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <ExpenseFilters
          categories={categories}
          year={year}
          month={month}
          categoryId={categoryId}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <ExpenseList expenses={expenses} />
      </div>
    </div>
  );
}
