import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { name, color } = await req.json();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { userId_name: { userId, name } } });
  if (existing) return NextResponse.json({ error: "Category already exists" }, { status: 409 });

  const category = await prisma.category.create({
    data: { userId, name, color: color || null },
  });

  return NextResponse.json(category, { status: 201 });
}
