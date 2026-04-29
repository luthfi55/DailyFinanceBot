import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { fromYear, fromMonth, toYear, toMonth } = await req.json();

  if (!fromYear || !fromMonth || !toYear || !toMonth) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (fromYear === toYear && fromMonth === toMonth) {
    return NextResponse.json({ error: "Cannot copy to the same month" }, { status: 400 });
  }

  // Fetch source categories (exclude template year=0,month=0)
  const sourceCategories = await prisma.category.findMany({
    where: { userId, year: fromYear, month: fromMonth },
  });

  if (sourceCategories.length === 0) {
    return NextResponse.json({ error: "No categories found in source month" }, { status: 404 });
  }

  // Fetch existing target categories to avoid duplicates
  const existingTargets = await prisma.category.findMany({
    where: { userId, year: toYear, month: toMonth },
    select: { name: true },
  });
  const existingNames = new Set(existingTargets.map((c) => c.name.toLowerCase()));

  const newCategories = sourceCategories
    .filter((c) => !existingNames.has(c.name.toLowerCase()))
    .map((c) => ({
      userId,
      name: c.name,
      color: c.color,
      icon: c.icon,
      isDefault: false,
      year: toYear,
      month: toMonth,
    }));

  if (newCategories.length === 0) {
    return NextResponse.json({ error: "All categories already exist in target month" }, { status: 409 });
  }

  await prisma.category.createMany({
    data: newCategories,
    skipDuplicates: true,
  });

  return NextResponse.json({ copied: newCategories.length }, { status: 201 });
}
