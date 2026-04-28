import type { WASocket, proto } from "@whiskeysockets/baileys";
import { prisma } from "@finance/db";
import { parseInput } from "./parser";
import { lidToPhone } from "./bot";

/* ─── Internal JSON logger ─── */
function logInternal(status: "success" | "error", message: string, data?: unknown) {
  const payload: Record<string, unknown> = { status, message };
  if (data !== undefined) payload.data = data;
  console.log("[INTERNAL_JSON]" + JSON.stringify(payload));
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function fmtNum(n: number) {
  return n.toLocaleString("en-GB");
}

function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "").replace(/^\+/, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (digits.startsWith("8") && !digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

export async function handleMessage(sock: WASocket, msg: proto.IWebMessageInfo) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

  if (!text) return;
  if (jid.endsWith("@g.us")) return;

  const resolvedJid = jid.endsWith("@lid") ? (lidToPhone.get(jid) ?? jid) : jid;
  const phoneRaw = resolvedJid.replace("@s.whatsapp.net", "").split(":")[0];
  const phone = normalizePhone(phoneRaw);

  console.log(`[handler] jid=${jid} phone=${phone} text=${text.slice(0, 40)}`);

  /* ─── 1. Identify user ─── */
  let user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
  if (!user) user = await prisma.user.findFirst({ where: { phoneNumber: phone } });

  if (!user) {
    console.log(`[handler] User not found for phone=${phone}`);
    await sock.sendMessage(jid, {
      text: "This number is not registered. Please register on the web and verify your WhatsApp number.",
    });
    logInternal("error", "Unregistered phone", { phone });
    return;
  }

  if (!user.isVerified) {
    await sock.sendMessage(jid, {
      text: "Your WhatsApp number is not verified yet. Please complete verification on the web.",
    });
    logInternal("error", "Unverified user", { userId: user.id });
    return;
  }

  /* ─── 2. Parse input ─── */
  const parsed = parseInput(text);

  /* ─── 3. Pending verification code? ─── */
  const pendingCode = await prisma.verificationCode.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (pendingCode && parsed.type !== "format") {
    await sock.sendMessage(jid, {
      text: `Your verification code: *${pendingCode.code}*\nEnter this code on the web within 10 minutes.`,
    });
    logInternal("success", "Pending code sent", { code: pendingCode.code });
    return;
  }

  /* ─── 4. Handle commands ─── */
  switch (parsed.type) {
    case "format": {
      const reply =
        "📋 Expense format:\n\n" +
        "• category-amount\n" +
        "  → saves for today\n" +
        "  example: food-14000\n\n" +
        "• category-amount-day-month-year\n" +
        "  → saves for specific date\n" +
        "  example: food-14000-27-April-2026\n\n" +
        "📌 Months must be written in full (January–December)";
      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/format command", {});
      return;
    }

    case "help": {
      const reply =
        "🤖 *Daily Finance Bot Commands*\n\n" +
        "*Input Expense:*\n" +
        "• food-14000\n" +
        "  → save expense for today\n" +
        "• food-14000-27-April-2026\n" +
        "  → save for specific date\n\n" +
        "*Commands:*\n" +
        "• /format — show input format\n" +
        "• /today — today's expenses\n" +
        "• /date DD-Month-YYYY — expenses by date\n" +
        "• /undo — remove last expense\n" +
        "• /clear — clear all expenses\n\n" +
        "🌐 Web: https://daily-finance-bot-web.vercel.app";
      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/help command", {});
      return;
    }

    case "today": {
      const today = new Date();
      const expenses = await prisma.expense.findMany({
        where: {
          userId: user.id,
          date: { gte: startOfDay(today), lte: endOfDay(today) },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });

      if (expenses.length === 0) {
        await sock.sendMessage(jid, { text: "📊 No expenses recorded today." });
        logInternal("success", "/today empty", { date: today });
        return;
      }

      const items = expenses.map((e) => ({ category: e.category.name, amount: e.amount }));
      const total = expenses.reduce((s, e) => s + e.amount, 0);
      const lines = items.map((i) => `• ${i.category}: ${fmtNum(i.amount)}`).join("\n");
      const reply = `📊 Today's expenses:\n\n${lines}\n\nTotal: ${fmtNum(total)}`;

      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/today command", { items, total });
      return;
    }

    case "date": {
      const target = parsed.date;
      const expenses = await prisma.expense.findMany({
        where: {
          userId: user.id,
          date: { gte: startOfDay(target), lte: endOfDay(target) },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });

      const label = fmtDate(target);
      if (expenses.length === 0) {
        await sock.sendMessage(jid, { text: `📅 No expenses found for ${label}.` });
        logInternal("success", "/date empty", { date: target });
        return;
      }

      const items = expenses.map((e) => ({ category: e.category.name, amount: e.amount }));
      const total = expenses.reduce((s, e) => s + e.amount, 0);
      const lines = items.map((i) => `• ${i.category}: ${fmtNum(i.amount)}`).join("\n");
      const reply = `📅 Expenses on ${label}:\n\n${lines}\n\nTotal: ${fmtNum(total)}`;

      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/date command", { date: target, items, total });
      return;
    }

    case "undo": {
      const lastExpense = await prisma.expense.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      if (!lastExpense) {
        await sock.sendMessage(jid, { text: "↩️ No expense to remove." });
        logInternal("error", "/undo empty", { userId: user.id });
        return;
      }

      await prisma.expense.delete({ where: { id: lastExpense.id } });
      await sock.sendMessage(jid, { text: "↩️ Last expense removed." });
      logInternal("success", "/undo command", { expenseId: lastExpense.id });
      return;
    }

    case "clear": {
      const { count } = await prisma.expense.deleteMany({ where: { userId: user.id } });
      await sock.sendMessage(jid, { text: "⚠️ All expenses have been cleared." });
      logInternal("success", "/clear command", { deletedCount: count });
      return;
    }

    case "expense": {
      const data = parsed.data;
      const expYear = data.date.getFullYear();
      const expMonth = data.date.getMonth() + 1;

      let category = await prisma.category.findFirst({
        where: { userId: user.id, name: { equals: data.category, mode: "insensitive" }, year: expYear, month: expMonth },
      });
      if (!category) {
        category = await prisma.category.findFirst({
          where: { userId: user.id, name: { equals: data.category, mode: "insensitive" }, year: 0, month: 0 },
        });
      }

      if (!category) {
        const monthCats = await prisma.category.findMany({
          where: { userId: user.id, OR: [{ year: expYear, month: expMonth }, { year: 0, month: 0 }] },
          select: { name: true },
        });
        const seen = new Set<string>();
        const allCategories = monthCats.filter((c: { name: string }) => {
          const key = c.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const names = allCategories.map((c: { name: string }) => c.name).join(", ");

        await sock.sendMessage(jid, {
          text: `Category "${data.category}" not found.\nAvailable categories: ${names}`,
        });
        logInternal("error", "Category not found", { category: data.category, available: names });
        return;
      }

      const expense = await prisma.expense.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          amount: data.amount,
          date: data.date,
        },
      });

      const isToday = new Date().toDateString() === data.date.toDateString();
      const dateLabel = isToday ? "Today" : fmtDate(data.date);
      const reply = `✅ Expense recorded\n\nCategory: ${category.name}\nAmount: ${fmtNum(data.amount)}\nDate: ${dateLabel}`;

      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "Expense recorded", {
        id: expense.id,
        category: category.name,
        amount: data.amount,
        date: data.date,
      });
      return;
    }

    case "unknown":
    default: {
      const reply =
        "❌ Invalid format\n\n" +
        "Please use:\n" +
        "category-amount\n" +
        "or\n" +
        "category-amount-day-month-year\n\n" +
        "Example:\n" +
        "food-14000";
      await sock.sendMessage(jid, { text: reply });
      logInternal("error", "Invalid format", { text: text.slice(0, 50) });
      return;
    }
  }
}
