"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { COURSE_COLORS } from "@/lib/constants";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  desc: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "",
    items: [
      { href: "/", label: "ダッシュボード", icon: "📊", desc: "学習進捗と合格確率の全体概要" },
    ],
  },
  {
    title: "学習",
    items: [
      { href: "/study", label: "SRS学習", icon: "📚", desc: "間隔反復でカードを効率的に記憶定着" },
      { href: "/synergy", label: "シナジー学習", icon: "🔗", desc: "CIA/CISA/CFE共通テーマを横断学習" },
      { href: "/quiz", label: "問題演習", icon: "✍️", desc: "トピック別の四肢択一問題で実力確認" },
      { href: "/mock-exam", label: "模擬試験", icon: "📝", desc: "本番形式の模擬試験で合格力を測定" },
    ],
  },
  {
    title: "ツール",
    items: [
      { href: "/tutor", label: "AI Tutor", icon: "🤖", desc: "AI講師に自由に質問・概念を深掘り" },
      { href: "/media", label: "スライド/音声", icon: "🎧", desc: "AIでスライドや音声教材を自動生成" },
    ],
  },
  {
    title: "分析",
    items: [
      { href: "/achievements", label: "実績", icon: "🏆", desc: "バッジやXPで学習のモチベーション管理" },
      { href: "/strategy", label: "受験戦略", icon: "🎯", desc: "3資格の最適受験順序と学習配分を提案" },
    ],
  },
  {
    title: "",
    items: [
      { href: "/settings", label: "設定", icon: "⚙️", desc: "コース登録・学習アルゴリズム設定" },
    ],
  },
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
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <div className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold px-3 pt-4 pb-1">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.desc}
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
          </div>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="my-2 border-t border-gray-800" />
            <Link
              href="/admin"
              title="ユーザー管理・システム設定"
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
