import { PrismaClient } from "./generated/prisma-client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "./generated/prisma-client";

/**
 * Ensure a user has category rows for a specific month.
 * If none exist, copies from the template rows (year=0, month=0).
 */
export async function ensureCategoriesForMonth(userId: string, year: number, month: number) {
  if (year === 0 && month === 0) return;

  const count = await prisma.category.count({
    where: { userId, year, month },
  });
  if (count > 0) return;

  const templates = await prisma.category.findMany({
    where: { userId, year: 0, month: 0 },
  });
  if (templates.length === 0) return;

  await prisma.category.createMany({
    data: templates.map((t) => ({
      userId,
      name: t.name,
      color: t.color,
      icon: t.icon,
      isDefault: false,
      year,
      month,
    })),
    skipDuplicates: true,
  });
}
