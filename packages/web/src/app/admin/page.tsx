import { prisma } from "@finance/db";
import { QRCodePanel } from "@/components/QRCodePanel";
import { DefaultCategoryManager } from "@/components/DefaultCategoryManager";

export default async function AdminPage() {
  const defaultCategories = await prisma.defaultCategory.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage the bot and default categories</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-1">WhatsApp Bot</h2>
        <p className="text-sm text-gray-500 mb-4">
          Scan this QR code with the bot&apos;s WhatsApp number to connect the bot.
        </p>
        <QRCodePanel />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-1">Default Categories</h2>
        <p className="text-sm text-gray-500 mb-4">
          These categories are assigned to every new user upon registration.
        </p>
        <DefaultCategoryManager categories={defaultCategories} />
      </div>
    </div>
  );
}
