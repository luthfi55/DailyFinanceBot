import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) return NextResponse.json({ error: "User not found" }, { status: 401 });

    const { sourceYear, sourceMonth, targetYear, targetMonth } = await req.json();

    if (!sourceYear || !sourceMonth || !targetYear || !targetMonth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (sourceYear === targetYear && sourceMonth === targetMonth) {
      return NextResponse.json({ error: "Source and target month cannot be the same" }, { status: 400 });
    }

    const sourceCategories = await prisma.category.findMany({
      where: { userId, year: sourceYear, month: sourceMonth },
    });

    if (sourceCategories.length === 0) {
      return NextResponse.json({ error: "No categories found in source month" }, { status: 404 });
    }

    const existingTargets = await prisma.category.findMany({
      where: { userId, year: targetYear, month: targetMonth },
      select: { name: true },
    });
    const existingNames = new Set(existingTargets.map((c) => c.name.toLowerCase()));

    let copied = 0;
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const src of sourceCategories) {
      if (existingNames.has(src.name.toLowerCase())) {
        skipped.push(src.name);
        continue;
      }
      try {
        await prisma.category.create({
          data: {
            userId,
            name: src.name,
            color: src.color,
            icon: src.icon,
            isDefault: false,
            year: targetYear,
            month: targetMonth,
          },
        });
        copied++;
      } catch (err: any) {
        errors.push(`${src.name}: ${err?.message || "unknown"}`);
      }
    }

    console.log("[copy categories]", { userId, sourceYear, sourceMonth, targetYear, targetMonth, sourceCount: sourceCategories.length, copied, skipped, errors });

    return NextResponse.json({ copied, skipped, errors });
  } catch (error: any) {
    console.error("[POST /api/categories/copy]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
