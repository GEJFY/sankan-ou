"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface PredictionData {
  predicted_score: number;
  pass_probability: number;
  passing_score: number;
  weak_topics: {
    topic_name: string;
    mastery_score: number;
    weight_pct: number;
    priority: number;
  }[];
  total_topics: number;
  studied_topics: number;
  recommendation: string;
}

interface PassProbabilityProps {
  courseId: string;
  courseCode: string;
  color: string;
}

export default function PassProbability({
  courseId,
  courseCode,
  color,
}: PassProbabilityProps) {
  const [data, setData] = useState<PredictionData | null>(null);

  useEffect(() => {
    apiFetch<PredictionData>(`/predictions/${courseId}`).then(setData).catch(() => {});
  }, [courseId]);

  if (!data) return null;

  const probPct = data.pass_probability;
  const gaugeAngle = (probPct / 100) * 180;

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span
          className="px-2 py-0.5 rounded text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {courseCode}
        </span>
        <h3 className="text-sm font-semibold text-zinc-300 tooltip-trigger">
          合格確率予測
          <span className="tooltip-content">カード習得率・正答率・学習進捗から算出した合格確率の予測値です。学習を継続すると精度が向上します。</span>
        </h3>
      </div>

      {/* 半円ゲージ */}
      <div className="flex justify-center">
        <div className="relative w-40 h-20 overflow-hidden">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            {/* 背景円弧 */}
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke="#27272a"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* 値円弧 */}
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(gaugeAngle / 180) * 283} 283`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <div className="text-2xl font-bold" style={{ color }}>
              {Math.round(probPct)}%
            </div>
          </div>
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-zinc-800/60 rounded-lg p-2 text-center tooltip-trigger">
          <div className="text-zinc-500">予測スコア</div>
          <div className="font-bold text-zinc-200">{data.predicted_score}点</div>
          <span className="tooltip-content">学習データから予測される試験スコア</span>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-2 text-center tooltip-trigger">
          <div className="text-zinc-500">合格基準</div>
          <div className="font-bold text-zinc-200">{data.passing_score}%</div>
          <span className="tooltip-content">この資格試験の合格に必要な最低スコア</span>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-2 text-center tooltip-trigger">
          <div className="text-zinc-500">学習済</div>
          <div className="font-bold text-zinc-200">
            {data.studied_topics}/{data.total_topics}
          </div>
          <span className="tooltip-content">学習を開始したトピック数 / 全トピック数</span>
        </div>
        <div className="bg-zinc-800/60 rounded-lg p-2 text-center tooltip-trigger">
          <div className="text-zinc-500">弱点</div>
          <div className="font-bold text-orange-400">
            {data.weak_topics.length}件
          </div>
          <span className="tooltip-content">習得率が低く、重点的な復習が推奨されるトピック数</span>
        </div>
      </div>

      {/* 推奨 */}
      <div className="text-xs text-zinc-400 bg-zinc-800/60 rounded-lg p-3">
        {data.recommendation}
      </div>

      {/* 弱点トピックTOP3 */}
      {data.weak_topics.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-zinc-500 font-semibold">
            優先学習トピック
          </div>
          {data.weak_topics.slice(0, 3).map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs bg-zinc-800/60 rounded px-2 py-1"
            >
              <span className="text-orange-400 font-bold">#{i + 1}</span>
              <span className="flex-1 truncate text-zinc-300">{t.topic_name}</span>
              <span className="text-zinc-500">
                {Math.round(t.mastery_score * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
