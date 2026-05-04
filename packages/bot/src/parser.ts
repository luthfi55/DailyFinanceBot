const MONTH_MAP: Record<string, number> = {
  // English
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
  // Indonesian (backward compatibility)
  januari: 0,
  februari: 1,
  maret: 2,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  oktober: 9,
  desember: 11,
};

export type ParsedExpense = {
  category: string;
  amount: number;
  date: Date;
};

export type ParsedCommand =
  | { type: "format" }
  | { type: "help" }
  | { type: "today" }
  | { type: "date"; date: Date }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "month" }
  | { type: "week" }
  | { type: "categories" }
  | { type: "budget"; category?: string }
  | { type: "last" }
  | { type: "summary" }
  | { type: "expense"; data: ParsedExpense }
  | { type: "unknown" };

export function parseInput(text: string): ParsedCommand {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Commands
  if (lower === "/format") return { type: "format" };
  if (lower === "/help") return { type: "help" };
  if (lower === "/today") return { type: "today" };
  if (lower === "/undo") return { type: "undo" };
  if (lower === "/clear") return { type: "clear" };
  if (lower === "/month") return { type: "month" };
  if (lower === "/week") return { type: "week" };
  if (lower === "/categories") return { type: "categories" };
  if (lower === "/budget") return { type: "budget" };
  if (lower.startsWith("/budget ")) {
    const category = trimmed.slice(7).trim();
    if (category) return { type: "budget", category };
  }
  if (lower === "/last") return { type: "last" };
  if (lower === "/summary") return { type: "summary" };

  // /date DD-Month-YYYY
  if (lower.startsWith("/date ")) {
    const rest = trimmed.slice(6).trim();
    const parts = rest.split("-");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const monthName = parts[1].trim().toLowerCase();
      const year = parseInt(parts[2]);
      const monthIndex = MONTH_MAP[monthName];
      if (!isNaN(day) && monthIndex !== undefined && !isNaN(year)) {
        const date = new Date(year, monthIndex, day);
        if (!isNaN(date.getTime())) {
          return { type: "date", date };
        }
      }
    }
  }

  // Expense format: category-amount or category-amount-day-month-year
  const parts = lower.split("-");

  if (parts.length >= 2) {
    const category = parts[0].trim();
    const amount = parseInt(parts[1].trim());

    if (category && !isNaN(amount) && amount > 0) {
      // Format with date: category-amount-day-month-year
      if (parts.length >= 5) {
        const day = parseInt(parts[2]);
        const monthName = parts[3].trim();
        const year = parseInt(parts[4]);

        const monthIndex = MONTH_MAP[monthName];

        if (!isNaN(day) && monthIndex !== undefined && !isNaN(year)) {
          const date = new Date(year, monthIndex, day);
          if (!isNaN(date.getTime())) {
            return { type: "expense", data: { category, amount, date } };
          }
        }
      }

      // Format without date → today
      return { type: "expense", data: { category, amount, date: new Date() } };
    }
  }

  return { type: "unknown" };
}

// Legacy export for backward compatibility
export function parseMessage(text: string): ParsedExpense | null {
  const result = parseInput(text);
  if (result.type === "expense") return result.data;
  return null;
}
