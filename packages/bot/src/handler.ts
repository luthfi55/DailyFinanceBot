import type { WASocket, proto } from "@whiskeysockets/baileys";
import { prisma } from "@finance/db";
import { parseInput } from "./parser";
import { lidToPhone, saveLidMapping } from "./bot";

// Track LIDs that are pending phone-number verification
const pendingLidVerifications = new Map<string, { requestedAt: number }>();

// Clean up old pending entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [lid, data] of pendingLidVerifications) {
    if (now - data.requestedAt > 10 * 60 * 1000) {
      pendingLidVerifications.delete(lid);
    }
  }
}, 10 * 60 * 1000);

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
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = (day + 6) % 7; // days since Monday
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}
function endOfWeek(d: Date) {
  const start = startOfWeek(d);
  const result = new Date(start);
  result.setDate(start.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function fmtNum(n: number) {
  return n.toLocaleString("en-GB");
}

function normalizePhone(input: string): string {
  // Hapus semua non-digit
  let digits = input.replace(/\D/g, "");
  // Hapus leading zeros (kecuali jika hanya 0)
  digits = digits.replace(/^0+/, "");
  // Jika dimulai dengan 8 dan belum ada 62, tambahkan 62
  if (digits.startsWith("8") && !digits.startsWith("62")) digits = "62" + digits;
  // Jika masih dimulai dengan 0 setelah strip (edge case), ganti dengan 62
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  return digits;
}

export async function handleMessage(sock: WASocket, msg: proto.IWebMessageInfo) {
  const jid = msg.key.remoteJid!;
  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

  if (!text) return;
  if (jid.endsWith("@g.us")) return;

  let resolvedJid = jid.endsWith("@lid") ? (lidToPhone.get(jid) ?? jid) : jid;

  const phoneRaw = resolvedJid.replace("@s.whatsapp.net", "").replace("@lid", "").split(":")[0];
  let phone = normalizePhone(phoneRaw);

  // ─── Handle unknown LID (privacy mode) ───
  if (jid.endsWith("@lid") && !lidToPhone.has(jid)) {
    const pending = pendingLidVerifications.get(jid);

    if (pending) {
      // User is replying with their phone number — validate it
      const phoneAttempt = normalizePhone(text);
      const userByPhone = await prisma.user.findUnique({ where: { phoneNumber: phoneAttempt } });

      if (userByPhone && userByPhone.isVerified) {
        // Success — store mapping
        lidToPhone.set(jid, phoneAttempt + "@s.whatsapp.net");
        saveLidMapping();
        pendingLidVerifications.delete(jid);
        console.log(`[handler] Mapped LID ${jid} → ${phoneAttempt} via user reply`);
        await sock.sendMessage(jid, {
          text: "✅ Device linked successfully!\n\nYou can now send your command.",
        });
        logInternal("success", "LID mapped", { jid, phone: phoneAttempt });
        return;
      } else {
        // Invalid phone or not registered
        await sock.sendMessage(jid, {
          text: "Number not registered or not verified. Please register on the web first.",
        });
        pendingLidVerifications.delete(jid);
        logInternal("error", "LID verification failed", { jid, phoneAttempt });
        return;
      }
    } else {
      // First message from this unknown LID
      // Only ask verification if message looks like a real command (not random spam)
      const looksLikeCommand =
        /^\/(format|help|today|undo|clear|date|month|week|categories|budget|last|summary)(\s|$)/i.test(text) ||
        /^[a-zA-Z]+-\d+/.test(text);

      if (looksLikeCommand) {
        await sock.sendMessage(jid, {
          text: "Unable to identify your account due to WhatsApp privacy mode.\n\nPlease reply with your registered phone number (e.g., 62895...) to link this device. You only need to do this once.",
        });
        pendingLidVerifications.set(jid, { requestedAt: Date.now() });
        console.log(`[handler] Asked LID ${jid} for phone verification`);
      } else {
        // Looks like random spam — silent ignore
        console.log(`[handler] LID mapping not found for ${jid} — silent ignore (random message)`);
        logInternal("error", "LID mapping missing", { jid });
      }
      return;
    }
  }

  console.log(`[handler] jid=${jid} resolvedJid=${resolvedJid} phoneRaw=${phoneRaw} phone=${phone} text=${text.slice(0, 40)}`);

  /* ─── 1. Identify user ─── */
  let user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
  if (!user) user = await prisma.user.findFirst({ where: { phoneNumber: phone } });

  if (!user) {
    console.log(`[handler] User not found for phone=${phone} (raw=${phoneRaw}) — silent ignore`);
    logInternal("error", "Unregistered phone", { phone, raw: phoneRaw });
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
        "• /week — this week's expenses\n" +
        "• /month — this month's expenses\n" +
        "• /summary — today + week + month totals\n" +
        "• /date DD-Month-YYYY — expenses by date\n" +
        "• /categories — list available categories\n" +
        "• /budget — remaining budget this month\n" +
        "• /budget <category> — budget detail for a category\n" +
        "• /last — view last expense\n" +
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

    case "week": {
      const now = new Date();
      const expenses = await prisma.expense.findMany({
        where: {
          userId: user.id,
          date: { gte: startOfWeek(now), lte: endOfWeek(now) },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });

      if (expenses.length === 0) {
        await sock.sendMessage(jid, { text: "📊 No expenses recorded this week." });
        logInternal("success", "/week empty", {});
        return;
      }

      const grouped: Record<string, number> = {};
      for (const e of expenses) {
        grouped[e.category.name] = (grouped[e.category.name] || 0) + e.amount;
      }
      const total = expenses.reduce((s, e) => s + e.amount, 0);
      const lines = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `• ${cat}: ${fmtNum(amt)}`)
        .join("\n");
      const reply = `📊 This week\n\n${lines}\n\nTotal: ${fmtNum(total)}`;

      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/week command", { total });
      return;
    }

    case "month": {
      const now = new Date();
      const expenses = await prisma.expense.findMany({
        where: {
          userId: user.id,
          date: { gte: startOfMonth(now), lte: endOfMonth(now) },
        },
        include: { category: true },
        orderBy: { date: "desc" },
      });

      if (expenses.length === 0) {
        const label = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        await sock.sendMessage(jid, { text: `📊 No expenses recorded for ${label}.` });
        logInternal("success", "/month empty", {});
        return;
      }

      const grouped: Record<string, number> = {};
      for (const e of expenses) {
        grouped[e.category.name] = (grouped[e.category.name] || 0) + e.amount;
      }
      const total = expenses.reduce((s, e) => s + e.amount, 0);
      const lines = Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `• ${cat}: ${fmtNum(amt)}`)
        .join("\n");
      const label = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      const reply = `📊 ${label}\n\n${lines}\n\nTotal: ${fmtNum(total)}`;

      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/month command", { total });
      return;
    }

    case "categories": {
      const now = new Date();
      const cats = await prisma.category.findMany({
        where: { userId: user.id, year: now.getFullYear(), month: now.getMonth() + 1 },
        orderBy: { name: "asc" },
      });

      if (cats.length === 0) {
        await sock.sendMessage(jid, { text: "📂 No categories set for this month. Add them on the web app first." });
        logInternal("error", "/categories empty", {});
        return;
      }

      const lines = cats.map((c) => `• ${c.name}`).join("\n");
      const label = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      const reply = `📂 Categories for ${label}:\n\n${lines}`;

      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/categories command", { count: cats.length });
      return;
    }

    case "budget": {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const label = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

      // ─── Category-specific budget (/budget food) ───
      if (parsed.category) {
        const categoryName = parsed.category;

        const category = await prisma.category.findFirst({
          where: { userId: user.id, name: { equals: categoryName, mode: "insensitive" }, year, month },
        });

        if (!category) {
          const monthCats = await prisma.category.findMany({
            where: { userId: user.id, year, month },
            select: { name: true },
          });
          const names = monthCats.map((c: { name: string }) => c.name).join(", ") || "None";
          await sock.sendMessage(jid, {
            text: `Category "${categoryName}" not found.\nAvailable categories: ${names}\n\nAdd categories on the web app first.`,
          });
          logInternal("error", "/budget category not found", { category: categoryName, available: names });
          return;
        }

        const catBudget = await prisma.categoryBudget.findFirst({
          where: { userId: user.id, categoryId: category.id, year, month },
        });

        const catExpenses = await prisma.expense.findMany({
          where: {
            userId: user.id,
            categoryId: category.id,
            date: { gte: startOfMonth(now), lte: endOfMonth(now) },
          },
          orderBy: { date: "desc" },
        });

        const totalSpent = catExpenses.reduce((s, e) => s + e.amount, 0);
        const budgetAmount = catBudget?.amount || 0;
        const remaining = budgetAmount - totalSpent;

        // Daily average: spent / days passed so far (or total days if month ended)
        const today = now.getDate();
        const daysInMonth = new Date(year, month, 0).getDate();
        const daysPassed = Math.min(today, daysInMonth);
        const dailyAvg = daysPassed > 0 ? Math.round(totalSpent / daysPassed) : 0;

        // Projected monthly spend at current rate
        const projected = Math.round(dailyAvg * daysInMonth);

        const expenseLines = catExpenses.map((e) => {
          const d = fmtDate(e.date);
          return `• ${d}: ${fmtNum(e.amount)}`;
        }).join("\n");

        const lines = [
          `💰 Budget: ${fmtNum(budgetAmount)}`,
          `💸 Spent: ${fmtNum(totalSpent)}`,
          `✅ Remaining: ${fmtNum(remaining)}`,
          `📊 Daily avg: ${fmtNum(dailyAvg)}`,
          `📈 Projected: ${fmtNum(projected)}`,
        ];

        const reply =
          `📊 ${category.name} — ${label}\n\n` +
          lines.join("\n") +
          (catExpenses.length > 0 ? `\n\n📝 Expenses:\n${expenseLines}` : "\n\n📝 No expenses this month.");

        await sock.sendMessage(jid, { text: reply });
        logInternal("success", "/budget category command", {
          category: category.name,
          budgetAmount,
          totalSpent,
          remaining,
          dailyAvg,
          projected,
        });
        return;
      }

      // ─── Overall monthly budget (/budget) ───
      const budget = await prisma.monthlyBudget.findFirst({
        where: { userId: user.id, year, month },
        include: { allocations: true },
      });

      const expenses = await prisma.expense.findMany({
        where: {
          userId: user.id,
          date: { gte: startOfMonth(now), lte: endOfMonth(now) },
        },
      });

      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const totalAllocations = budget?.allocations.reduce((s, a) => s + a.amount, 0) || 0;
      const startingBalance = budget?.startingBalance || 0;
      const remaining = startingBalance - totalAllocations - totalExpenses;

      const lines = [
        `💰 Starting balance: ${fmtNum(startingBalance)}`,
        `📤 Allocations: ${fmtNum(totalAllocations)}`,
        `💸 Expenses: ${fmtNum(totalExpenses)}`,
        `───────────────`,
        `✅ Remaining: ${fmtNum(remaining)}`,
      ];

      const reply = `📊 Budget ${label}\n\n${lines.join("\n")}`;
      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/budget command", { startingBalance, totalAllocations, totalExpenses, remaining });
      return;
    }

    case "last": {
      const lastExpense = await prisma.expense.findFirst({
        where: { userId: user.id },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      });

      if (!lastExpense) {
        await sock.sendMessage(jid, { text: "📝 No expenses recorded yet." });
        logInternal("error", "/last empty", {});
        return;
      }

      const dateLabel = lastExpense.date.toDateString() === new Date().toDateString() ? "Today" : fmtDate(lastExpense.date);
      const reply =
        `📝 Last expense\n\n` +
        `Category: ${lastExpense.category.name}\n` +
        `Amount: ${fmtNum(lastExpense.amount)}\n` +
        `Date: ${dateLabel}` +
        (lastExpense.note ? `\nNote: ${lastExpense.note}` : "");

      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/last command", { id: lastExpense.id });
      return;
    }

    case "summary": {
      const now = new Date();

      const todayExpenses = await prisma.expense.findMany({
        where: { userId: user.id, date: { gte: startOfDay(now), lte: endOfDay(now) } },
      });
      const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);

      const weekExpenses = await prisma.expense.findMany({
        where: { userId: user.id, date: { gte: startOfWeek(now), lte: endOfWeek(now) } },
      });
      const weekTotal = weekExpenses.reduce((s, e) => s + e.amount, 0);

      const monthExpenses = await prisma.expense.findMany({
        where: { userId: user.id, date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      });
      const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

      const reply =
        `📊 Financial Summary\n\n` +
        `📅 Today: ${fmtNum(todayTotal)}\n` +
        `📆 This week: ${fmtNum(weekTotal)}\n` +
        `🗓️ This month: ${fmtNum(monthTotal)}`;

      await sock.sendMessage(jid, { text: reply });
      logInternal("success", "/summary command", { todayTotal, weekTotal, monthTotal });
      return;
    }

    case "expense": {
      const data = parsed.data;
      const expYear = data.date.getFullYear();
      const expMonth = data.date.getMonth() + 1;

      const category = await prisma.category.findFirst({
        where: { userId: user.id, name: { equals: data.category, mode: "insensitive" }, year: expYear, month: expMonth },
      });

      if (!category) {
        const monthCats = await prisma.category.findMany({
          where: { userId: user.id, year: expYear, month: expMonth },
          select: { name: true },
        });
        const names = monthCats.map((c: { name: string }) => c.name).join(", ") || "None";

        await sock.sendMessage(jid, {
          text: `Category "${data.category}" not found.\nAvailable categories: ${names}\n\nAdd categories on the web app first.`,
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
      console.log(`[handler] Invalid format from ${phone} — silent ignore`);
      logInternal("error", "Invalid format - silent ignore", { text: text.slice(0, 50) });
      return;
    }
  }
}
