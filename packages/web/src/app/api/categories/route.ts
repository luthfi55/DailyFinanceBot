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
      console.error("[POST /api/categories] Session missing user.id", session);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      console.error("[POST /api/categories] User not found for id:", userId);
      return NextResponse.json({ error: "User not found. Please log out and log in again." }, { status: 401 });
    }

    const { name, color, year = 0, month = 0 } = await req.json();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const existing = await prisma.category.findUnique({
      where: { userId_name_year_month: { userId, name, year, month } },
    });
    if (existing) return NextResponse.json({ error: "Category already exists" }, { status: 409 });

    const category = await prisma.category.create({
      data: { userId, name, color: color || null, year, month },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/categories]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
