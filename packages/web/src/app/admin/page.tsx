import { prisma } from "@finance/db";
import { startOfMonth, endOfMonth } from "date-fns";
import { QRCodePanel } from "@/components/QRCodePanel";

export default async function AdminPage() {
  const now = new Date();

  const totalExpenses = await prisma.expense.count({
    where: { date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
  });

  return (
    <div className="space-y-5 flex flex-col" style={{ minHeight: "calc(100vh - 3rem)" }}>
      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 flex-1 items-stretch">
        <QRCodePanel />
        <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-center">
          <p className="text-sm text-gray-400">Admin settings simplified. Default categories are now hardcoded.</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
          iconClass="bg-green-100 text-green-600"
          label="Bot Status"
          value="Connected"
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          }
          iconClass="bg-blue-100 text-blue-500"
          label="Last Sync"
          value="Live"
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          }
          iconClass="bg-gray-100 text-gray-700"
          label="Monthly Volume"
          value={`${totalExpenses} Expenses`}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          iconClass="bg-red-50 text-red-500"
          label="Errors"
          value="0 Flags"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
