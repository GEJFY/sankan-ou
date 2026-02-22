"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Flame, Zap, Star, BookOpen, Trophy } from "lucide-react";

interface TodayStats {
  cards_reviewed: number;
  cards_correct: number;
  duration_seconds: number;
  session_count: number;
  streak_days: number;
}

export default function StreakBadge() {
  const [stats, setStats] = useState<TodayStats | null>(null);

  useEffect(() => {
    apiFetch<TodayStats>("/sessions/today").then(setStats).catch(() => {});
  }, []);

  if (!stats) return null;

  const StreakIcon =
    stats.streak_days >= 30
      ? Trophy
      : stats.streak_days >= 14
        ? Flame
        : stats.streak_days >= 7
          ? Zap
          : stats.streak_days >= 3
            ? Star
            : BookOpen;

  const durationMin = Math.round(stats.duration_seconds / 60);

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6 space-y-4">
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">今日の成績</h3>

      {/* Streak */}
      <div className="text-center">
        <StreakIcon size={32} className="mx-auto text-amber-500" />
        <div className="text-2xl font-bold mt-1.5 text-zinc-200 tabular-nums">
          {stats.streak_days}日連続
        </div>
        <div className="text-xs text-zinc-600">
          {stats.streak_days >= 7
            ? "素晴らしい継続です！"
            : "毎日の学習が合格への近道"}
        </div>
      </div>

      {/* Today stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3 text-center tooltip-trigger">
          <div className="text-lg font-bold text-zinc-200 tabular-nums">{stats.cards_reviewed}</div>
          <div className="text-zinc-600">カード復習</div>
          <span className="tooltip-content">今日復習したフラッシュカードの総数</span>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3 text-center tooltip-trigger">
          <div className="text-lg font-bold text-zinc-200 tabular-nums">
            {stats.cards_reviewed > 0
              ? Math.round((stats.cards_correct / stats.cards_reviewed) * 100)
              : 0}
            %
          </div>
          <div className="text-zinc-600">正答率</div>
          <span className="tooltip-content">Good以上の評価をしたカードの割合</span>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3 text-center tooltip-trigger">
          <div className="text-lg font-bold text-zinc-200 tabular-nums">{durationMin}</div>
          <div className="text-zinc-600">学習時間(分)</div>
          <span className="tooltip-content">今日の合計学習時間（分単位）</span>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/30 rounded-lg p-3 text-center tooltip-trigger">
          <div className="text-lg font-bold text-zinc-200 tabular-nums">{stats.session_count}</div>
          <div className="text-zinc-600">セッション</div>
          <span className="tooltip-content">今日行った学習セッションの回数</span>
        </div>
      </div>
    </div>
  );
}
