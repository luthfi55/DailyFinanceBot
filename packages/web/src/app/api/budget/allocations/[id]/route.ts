import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

async function verifyOwnership(userId: string, id: string) {
  const alloc = await prisma.budgetAllocation.findUnique({
    where: { id },
    include: { budget: { select: { userId: true } } },
  });
  if (!alloc || alloc.budget.userId !== userId) return null;
  return alloc;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const alloc = await verifyOwnership(userId, params.id);
  if (!alloc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { label, amount } = await req.json();
  const updated = await prisma.budgetAllocation.update({
    where: { id: params.id },
    data: { label, amount: Math.round(amount) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const alloc = await verifyOwnership(userId, params.id);
  if (!alloc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.budgetAllocation.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
