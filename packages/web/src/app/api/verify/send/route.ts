import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@finance/db";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { phoneNumber } = await req.json();

  if (!phoneNumber || !/^62\d{9,12}$/.test(phoneNumber)) {
    return NextResponse.json({ error: "Invalid number format (example: 628123456789)" }, { status: 400 });
  }

  const phoneInUse = await prisma.user.findFirst({
    where: { phoneNumber, NOT: { id: userId } },
  });
  if (phoneInUse) {
    return NextResponse.json({ error: "Number already linked to another account" }, { status: 409 });
  }

  await prisma.user.update({ where: { id: userId }, data: { phoneNumber, isVerified: false } });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.verificationCode.create({ data: { userId, code, expiresAt } });

  // Kirim kode via bot
  let botUrl = process.env.BOT_URL ?? "http://localhost:3001";
  if (!botUrl.startsWith("http://") && !botUrl.startsWith("https://")) {
    botUrl = `https://${botUrl}`;
  }
  try {
    const botRes = await fetch(`${botUrl}/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, code }),
    });
    if (!botRes.ok) {
      return NextResponse.json({ error: "Bot tidak terhubung. Pastikan bot sudah scan QR." }, { status: 503 });
    }
  } catch {
    return NextResponse.json({ error: "Tidak bisa menghubungi bot server." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
