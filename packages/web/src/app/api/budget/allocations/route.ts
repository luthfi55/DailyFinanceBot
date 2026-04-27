import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { budgetId, label, amount, order } = await req.json();

  if (!budgetId || !label || amount === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify budget belongs to user
  const budget = await prisma.monthlyBudget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allocation = await prisma.budgetAllocation.create({
    data: { budgetId, label, amount: Math.round(amount), order: order ?? 0 },
  });

  return NextResponse.json(allocation, { status: 201 });
}
