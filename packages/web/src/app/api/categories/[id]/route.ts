import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const category = await prisma.category.findFirst({
      where: { id: params.id, userId },
    });

    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    await prisma.category.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[DELETE /api/categories]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
