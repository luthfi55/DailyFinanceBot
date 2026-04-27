import type { WASocket } from "@whiskeysockets/baileys";
import { prisma } from "@finance/db";

export async function sendVerificationCode(
  sock: WASocket,
  phoneNumber: string,
  code: string
) {
  const jid = phoneNumber + "@s.whatsapp.net";
  await sock.sendMessage(jid, {
    text: `Kode verifikasi Daily Finance Bot kamu:\n\n*${code}*\n\nBerlaku 10 menit. Jangan bagikan ke siapapun.`,
  });
}
