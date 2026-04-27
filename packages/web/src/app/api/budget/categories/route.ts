import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: 2026-04

  const [year, mon] = month
    ? month.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];

  const budgets = await prisma.categoryBudget.findMany({
    where: { userId, year, month: mon },
  });

  return NextResponse.json(budgets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { categoryId, year, month, amount } = await req.json();

  if (!categoryId || !year || !month || amount === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify category belongs to user
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  if (amount <= 0) {
    // Delete budget if amount is 0 (user cleared it)
    await prisma.categoryBudget.deleteMany({
      where: { userId, categoryId, year, month },
    });
    return NextResponse.json({ deleted: true });
  }

  const budget = await prisma.categoryBudget.upsert({
    where: { userId_categoryId_year_month: { userId, categoryId, year, month } },
    update: { amount: Math.round(amount) },
    create: { userId, categoryId, year, month, amount: Math.round(amount) },
  });

  return NextResponse.json(budget);
}
