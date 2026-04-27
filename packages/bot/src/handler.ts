import type { WASocket, proto } from "@whiskeysockets/baileys";
import { prisma } from "@finance/db";
import { parseMessage } from "./parser";
import { sendVerificationCode } from "./verify";

export async function handleMessage(sock: WASocket, msg: proto.IWebMessageInfo) {
  const jid = msg.key.remoteJid!;
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  if (!text) return;

  const phoneRaw = jid.replace("@s.whatsapp.net", "");
  const phone = phoneRaw.startsWith("0") ? "62" + phoneRaw.slice(1) : phoneRaw;

  // Cek user terdaftar
  const user = await prisma.user.findUnique({ where: { phoneNumber: phone } });

  if (!user) {
    await sock.sendMessage(jid, {
      text: "Nomor ini belum terdaftar. Daftar dulu di web dan verifikasi nomor WA kamu.",
    });
    return;
  }

  if (!user.isVerified) {
    await sock.sendMessage(jid, {
      text: "Nomor WA kamu belum terverifikasi. Masuk ke web dan selesaikan verifikasi.",
    });
    return;
  }

  // Cek apakah ada pending verification code untuk user ini
  const pendingCode = await prisma.verificationCode.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (pendingCode) {
    await sock.sendMessage(jid, {
      text: `Kode verifikasi kamu: *${pendingCode.code}*\nMasukkan kode ini di web dalam 10 menit.`,
    });
    return;
  }

  // Command /format
  if (text.trim().toLowerCase() === "/format") {
    await sock.sendMessage(jid, {
      text:
        "📋 *Format input pengeluaran:*\n\n" +
        "1️⃣ *kategori-jumlah*\n" +
        "   → Simpan ke tanggal hari ini\n" +
        "   Contoh: `makan-15000`\n\n" +
        "2️⃣ *kategori-jumlah-tanggal-bulan-tahun*\n" +
        "   → Simpan ke tanggal tertentu\n" +
        "   Contoh: `makan-15000-27-April-2026`\n\n" +
        "📌 *Nama bulan:* Januari, Februari, Maret, April, Mei, Juni, Juli, Agustus, September, Oktober, November, Desember",
    });
    return;
  }

  // Parse expense command
  const parsed = parseMessage(text);

  if (!parsed) {
    await sock.sendMessage(jid, {
      text:
        "Format tidak dikenali.\nContoh:\n• makan-10000\n• makan-10000-28-Mei-2026",
    });
    return;
  }

  // Cari kategori user
  const category = await prisma.category.findFirst({
    where: {
      userId: user.id,
      name: { equals: parsed.category, mode: "insensitive" },
    },
  });

  if (!category) {
    const allCategories = await prisma.category.findMany({
      where: { userId: user.id },
      select: { name: true },
    });
    const names = allCategories.map((c: { name: string }) => c.name).join(", ");
    await sock.sendMessage(jid, {
      text: `Kategori "${parsed.category}" tidak ditemukan.\nKategori tersedia: ${names}`,
    });
    return;
  }

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      categoryId: category.id,
      amount: parsed.amount,
      date: parsed.date,
    },
  });

  const dateStr = parsed.date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  await sock.sendMessage(jid, {
    text: `Tersimpan!\n${category.name} — Rp ${parsed.amount.toLocaleString("id-ID")}\n${dateStr}`,
  });
}
