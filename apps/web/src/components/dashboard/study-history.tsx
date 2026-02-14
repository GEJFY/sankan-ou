"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface DailyHistory {
  date: string;
  cards_reviewed: number;
  correct_rate: number;
}

export default function StudyHistory() {
  const [history, setHistory] = useState<DailyHistory[]>([]);

  useEffect(() => {
    apiFetch<{ history: DailyHistory[] }>("/dashboard/history")
      .then((d) => setHistory(d.history))
      .catch(() => {});
  }, []);

  if (history.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">学習履歴</h3>
        <div className="text-xs text-gray-500 text-center py-4">
          まだ学習データがありません
        </div>
      </div>
    );
  }

  // 直近14日分
  const recent = history.slice(-14);
  const maxCards = Math.max(...recent.map((d) => d.cards_reviewed), 1);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-3">
      <h3 className="text-sm font-semibold text-gray-300">学習履歴（14日間）</h3>

      {/* バーチャート */}
      <div className="flex items-end gap-1 h-24">
        {recent.map((day, i) => {
          const height = (day.cards_reviewed / maxCards) * 100;
          const hue = day.correct_rate >= 0.8 ? 142 : day.correct_rate >= 0.5 ? 45 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${Math.max(height, 4)}%`,
                  backgroundColor: `hsl(${hue}, 60%, 50%)`,
                  opacity: 0.8,
                }}
                title={`${day.date}: ${day.cards_reviewed}枚 (${Math.round(day.correct_rate * 100)}%)`}
              />
            </div>
          );
        })}
      </div>

      {/* 日付ラベル (最初と最後のみ) */}
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>{recent[0]?.date?.slice(5)}</span>
        <span>{recent[recent.length - 1]?.date?.slice(5)}</span>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="text-gray-500">合計</div>
          <div className="font-bold">
            {recent.reduce((s, d) => s + d.cards_reviewed, 0)}枚
          </div>
        </div>
        <div>
          <div className="text-gray-500">平均/日</div>
          <div className="font-bold">
            {Math.round(
              recent.reduce((s, d) => s + d.cards_reviewed, 0) / recent.length
            )}
            枚
          </div>
        </div>
        <div>
          <div className="text-gray-500">正答率</div>
          <div className="font-bold text-green-400">
            {Math.round(
              (recent.reduce((s, d) => s + d.correct_rate, 0) / recent.length) *
                100
            )}
            %
          </div>
        </div>
      </div>
    </div>
  );
}
