import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-[100dvh] md:h-screen overflow-hidden">
      <Sidebar role={(session.user as any).role} username={(session.user as any).username} />
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6">{children}</main>
      <MobileBottomNav role={(session.user as any).role} />
    </div>
  );
}
