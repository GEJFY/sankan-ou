"use client";

import Link from "next/link";

interface TodayTasksProps {
  totalDue: number;
  studiedToday: number;
}

export default function TodayTasks({ totalDue, studiedToday }: TodayTasksProps) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        今日のタスク
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">復習カード</span>
          <span className="font-bold text-lg">{totalDue}枚</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">学習済み</span>
          <span className="font-bold text-lg text-green-400">
            {studiedToday}枚
          </span>
        </div>
      </div>

      {totalDue > 0 && (
        <Link
          href="/study"
          className="mt-4 block w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
        >
          学習を始める
        </Link>
      )}
    </div>
  );
}
