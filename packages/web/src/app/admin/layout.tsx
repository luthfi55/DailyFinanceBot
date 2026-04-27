import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={(session.user as any).role} username={(session.user as any).username} />
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
