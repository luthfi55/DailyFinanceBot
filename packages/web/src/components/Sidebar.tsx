"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/expenses", label: "Expenses" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({ role, username }: { role: string; username: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-5 border-b border-gray-200">
        <p className="font-bold text-gray-900 text-sm">Daily Finance</p>
        <p className="text-xs text-gray-500 mt-0.5">@{username}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-3 py-2 rounded-lg text-sm transition",
              pathname === item.href
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {item.label}
          </Link>
        ))}

        {role === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "block px-3 py-2 rounded-lg text-sm transition",
              pathname.startsWith("/admin")
                ? "bg-purple-50 text-purple-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Admin
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg text-left transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
