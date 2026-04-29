import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId },
  });

  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  if (category.year === 0 && category.month === 0) {
    return NextResponse.json({ error: "Default template categories cannot be deleted" }, { status: 403 });
  }

  await prisma.category.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
