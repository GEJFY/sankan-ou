"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

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

  const streakEmoji =
    stats.streak_days >= 30
      ? "🏆"
      : stats.streak_days >= 14
        ? "🔥"
        : stats.streak_days >= 7
          ? "⚡"
          : stats.streak_days >= 3
            ? "✨"
            : "📚";

  const durationMin = Math.round(stats.duration_seconds / 60);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300">今日の成績</h3>

      {/* ストリーク */}
      <div className="text-center">
        <div className="text-4xl">{streakEmoji}</div>
        <div className="text-2xl font-bold mt-1">
          {stats.streak_days}日連続
        </div>
        <div className="text-xs text-gray-500">
          {stats.streak_days >= 7
            ? "素晴らしい継続です！"
            : "毎日の学習が合格への近道"}
        </div>
      </div>

      {/* 今日の統計 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{stats.cards_reviewed}</div>
          <div className="text-gray-500">カード復習</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">
            {stats.cards_reviewed > 0
              ? Math.round((stats.cards_correct / stats.cards_reviewed) * 100)
              : 0}
            %
          </div>
          <div className="text-gray-500">正答率</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{durationMin}</div>
          <div className="text-gray-500">学習時間(分)</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{stats.session_count}</div>
          <div className="text-gray-500">セッション</div>
        </div>
      </div>
    </div>
  );
}
