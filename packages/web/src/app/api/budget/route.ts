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

  const budget = await prisma.monthlyBudget.findUnique({
    where: { userId_year_month: { userId, year, month: mon } },
    include: { allocations: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(budget ?? null);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { year, month, startingBalance } = await req.json();

  if (!year || !month || startingBalance === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const budget = await prisma.monthlyBudget.upsert({
    where: { userId_year_month: { userId, year, month } },
    update: { startingBalance: Math.round(startingBalance) },
    create: { userId, year, month, startingBalance: Math.round(startingBalance) },
    include: { allocations: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(budget);
}
