"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  BookOpen,
  GitMerge,
  PenLine,
  FileCheck2,
  MessageSquareText,
  Presentation,
  Trophy,
  Target,
  Settings,
  ShieldCheck,
  LogOut,
  Info,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
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
      { href: "/", label: "ダッシュボード", icon: LayoutDashboard, desc: "学習進捗と合格確率の全体概要" },
    ],
  },
  {
    title: "学習",
    items: [
      { href: "/study", label: "SRS学習", icon: BookOpen, desc: "間隔反復（FSRS）でカードを効率的に記憶定着。復習タイミングをAIが最適化します" },
      { href: "/synergy", label: "シナジー学習", icon: GitMerge, desc: "CIA/CISA/CFEの共通テーマ（リスク管理・内部統制等）を横断学習。一度の学習で複数資格の知識を強化" },
      { href: "/quiz", label: "問題演習", icon: PenLine, desc: "トピック別の四肢択一問題。DB保存済み問題を優先し、不足分はAIが自動生成します" },
      { href: "/mock-exam", label: "模擬試験", icon: FileCheck2, desc: "各資格の本番形式（パート構成・問題数・時間配分）に準拠した模擬試験" },
    ],
  },
  {
    title: "ツール",
    items: [
      { href: "/tutor", label: "AI Tutor", icon: MessageSquareText, desc: "5つのモード（解説・演習・FAQ・用語・ケース分析）でAI講師に質問" },
      { href: "/media", label: "スライド/音声", icon: Presentation, desc: "カテゴリを選択してAIがスライドや音声学習教材を自動生成" },
    ],
  },
  {
    title: "分析",
    items: [
      { href: "/achievements", label: "実績", icon: Trophy, desc: "XP・バッジ・デイリーミッションで学習モチベーションを管理" },
      { href: "/strategy", label: "受験戦略", icon: Target, desc: "学習データから合格確率を予測し、最適な受験順序と時間配分を提案" },
    ],
  },
  {
    title: "",
    items: [
      { href: "/settings", label: "設定", icon: Settings, desc: "コース登録・目標記憶率・パスワード変更" },
    ],
  },
];

/** CIA/CISA/CFE only - hardcoded for the Triple Crown indicator */
const CERT_INDICATORS = [
  { code: "CIA", color: "#e94560" },
  { code: "CISA", color: "#0891b2" },
  { code: "CFE", color: "#7c3aed" },
] as const;

/**
 * Determine whether a nav item should use tooltip-below class
 * (items near the top of the screen where upward tooltips get clipped).
 * Group index 0 = dashboard, group index 1 = 学習 group.
 */
function shouldTooltipBelow(groupIndex: number): boolean {
  return groupIndex <= 1;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Theme state: "dark" (default) or "light"
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else {
      // Default to dark
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <aside className="w-[260px] bg-zinc-950 border-r border-zinc-800/60 min-h-screen flex flex-col">
      {/* Logo area */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm tracking-tight">GRC</span>
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-zinc-100">
              Triple Crown
            </h1>
            <p className="text-[10px] text-zinc-500 tracking-wide">三冠王 — CIA / CISA / CFE</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-zinc-800/60" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <div className="text-[10px] uppercase tracking-[0.08em] text-zinc-600 font-medium px-3 pt-5 pb-1.5">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              const tooltipClass = shouldTooltipBelow(gi)
                ? "tooltip-trigger tooltip-below"
                : "tooltip-trigger";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                    isActive
                      ? "bg-zinc-800/80 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-400"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  <span className={tooltipClass}>
                    <Info
                      size={12}
                      className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-help"
                    />
                    <span className="tooltip-content">{item.desc}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="my-2 mx-3 h-px bg-zinc-800/60" />
            <Link
              href="/admin"
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                pathname === "/admin"
                  ? "bg-zinc-800/80 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              }`}
            >
              <ShieldCheck
                size={16}
                strokeWidth={pathname === "/admin" ? 2 : 1.5}
                className={pathname === "/admin" ? "text-purple-400" : "text-zinc-600 group-hover:text-zinc-400"}
              />
              <span>管理画面</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-4 space-y-3">
        <div className="h-px bg-zinc-800/60" />

        {user && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-400">
                {user.display_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-xs text-zinc-500 truncate max-w-[120px]">
                {user.display_name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
                className="p-1.5 rounded-md text-zinc-600 hover:text-amber-400 hover:bg-zinc-800/60 transition"
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              {/* Logout */}
              <button
                onClick={logout}
                title="ログアウト"
                className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800/60 transition"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Course indicator dots - CIA/CISA/CFE only */}
        <div className="flex items-center gap-3 px-1">
          {CERT_INDICATORS.map(({ code, color }) => (
            <div key={code} className="flex items-center gap-1.5" title={code}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-zinc-600">{code}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-zinc-700 px-1">v0.5.0</p>
      </div>
    </aside>
  );
}
