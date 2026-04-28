import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@finance/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json();

  if (!username || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const isAdmin = username === process.env.ADMIN_USERNAME;

  const defaultCategories = await prisma.defaultCategory.findMany({
    orderBy: { order: "asc" },
  });

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashed,
      role: isAdmin ? "ADMIN" : "USER",
      categories: {
        create: defaultCategories.map((cat) => ({
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          isDefault: true,
        })),
      },
    },
  });

  return NextResponse.json({ id: user.id, username: user.username });
}
