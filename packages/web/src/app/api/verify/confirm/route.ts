import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { code } = await req.json();

  const record = await prisma.verificationCode.findFirst({
    where: {
      userId,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  await Promise.all([
    prisma.verificationCode.update({ where: { id: record.id }, data: { used: true } }),
    prisma.user.update({ where: { id: userId }, data: { isVerified: true } }),
  ]);

  return NextResponse.json({ ok: true });
}
