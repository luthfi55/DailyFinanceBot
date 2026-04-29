import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any)?.id;
    if (!userId) {
      console.error("[POST /api/expenses] Session missing user.id");
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      return NextResponse.json({ error: "User not found. Please log out and log in again." }, { status: 401 });
    }

    const { categoryId, amount, date, note } = await req.json();

    if (!categoryId || !amount || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        categoryId,
        amount: Math.round(amount),
        date: new Date(date),
        note: note || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/expenses]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");

    let dateFilter = {};
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      dateFilter = {
        gte: new Date(year, mon - 1, 1),
        lte: new Date(year, mon, 0, 23, 59, 59),
      };
    }

    const expenses = await prisma.expense.findMany({
      where: { userId, ...(month ? { date: dateFilter } : {}) },
      include: { category: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error("[GET /api/expenses]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
