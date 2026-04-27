const MONTH_MAP: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

type ParsedExpense = {
  category: string;
  amount: number;
  date: Date;
};

export function parseMessage(text: string): ParsedExpense | null {
  const trimmed = text.trim().toLowerCase();

  // Format: kategori-jumlah atau kategori-jumlah-tanggal-bulan-tahun
  const parts = trimmed.split("-");

  if (parts.length < 2) return null;

  const category = parts[0].trim();
  const amount = parseInt(parts[1].trim());

  if (!category || isNaN(amount) || amount <= 0) return null;

  // Format dengan tanggal: kategori-jumlah-tanggal-bulan-tahun
  if (parts.length >= 5) {
    const day = parseInt(parts[2]);
    const monthName = parts[3].trim();
    const year = parseInt(parts[4]);

    const monthIndex = MONTH_MAP[monthName];

    if (isNaN(day) || monthIndex === undefined || isNaN(year)) return null;

    const date = new Date(year, monthIndex, day);
    if (isNaN(date.getTime())) return null;

    return { category, amount, date };
  }

  // Format tanpa tanggal → hari ini
  return { category, amount, date: new Date() };
}
