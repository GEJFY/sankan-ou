"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface TodayTasksProps {
  totalDue: number;
  studiedToday: number;
}

export default function TodayTasks({ totalDue, studiedToday }: TodayTasksProps) {
  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
        今日のタスク
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between tooltip-trigger">
          <span className="text-zinc-400 text-sm">復習カード</span>
          <span className="font-bold text-lg text-zinc-200 tabular-nums">{totalDue}枚</span>
          <span className="tooltip-content">FSRSアルゴリズムが今日復習すべきと判定したカード数。毎日の復習が記憶定着の鍵です。</span>
        </div>
        <div className="flex items-center justify-between tooltip-trigger">
          <span className="text-zinc-400 text-sm">学習済み</span>
          <span className="font-bold text-lg text-emerald-400 tabular-nums">
            {studiedToday}枚
          </span>
          <span className="tooltip-content">今日既に復習を完了したカード数</span>
        </div>
      </div>

      {totalDue > 0 && (
        <Link
          href="/study"
          className="mt-4 flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          学習を始める
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
