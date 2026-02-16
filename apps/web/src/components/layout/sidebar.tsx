"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { COURSE_COLORS } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード", icon: "📊" },
  { href: "/study", label: "学習", icon: "📚" },
  { href: "/synergy", label: "シナジー学習", icon: "🔗" },
  { href: "/quiz", label: "問題演習", icon: "✍️" },
  { href: "/mock-exam", label: "模擬試験", icon: "📝" },
  { href: "/tutor", label: "AI Tutor", icon: "🤖" },
  { href: "/media", label: "スライド/音声", icon: "🎧" },
  { href: "/achievements", label: "実績", icon: "🏆" },
  { href: "/strategy", label: "受験戦略", icon: "🎯" },
  { href: "/settings", label: "設定", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">GRC Triple Crown</h1>
        <p className="text-xs text-gray-500 mt-1">三冠王</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <>
            <div className="my-2 border-t border-gray-800" />
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === "/admin"
                  ? "bg-purple-600/20 text-purple-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <span>{"🛡️"}</span>
              <span>管理画面</span>
            </Link>
          </>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-800 space-y-3">
        {user && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 truncate">{user.display_name}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-500 hover:text-red-400 transition"
            >
              ログアウト
            </button>
          </div>
        )}
        <div className="flex gap-2">
          {Object.entries(COURSE_COLORS).map(([code, color]) => (
            <span
              key={code}
              className="w-3 h-3 rounded-full"
              title={code}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-600">v0.5.0</p>
      </div>
    </aside>
  );
}
