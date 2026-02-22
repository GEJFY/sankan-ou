"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api-client";
import { ArrowRight } from "lucide-react";

interface Course {
  id: string;
  code: string;
  name: string;
  color: string;
}

interface PredictionData {
  predicted_score: number;
  pass_probability: number;
  passing_score: number;
  weak_topics: { topic_name: string; mastery_score: number; priority: number }[];
  total_topics: number;
  studied_topics: number;
  recommendation: string;
}

interface ROIData {
  total_cards: number;
  mastered_cards: number;
  remaining_cards: number;
  estimated_hours_remaining: number;
  total_study_hours: number;
}

interface CourseStrategy {
  course: Course;
  prediction: PredictionData | null;
  roi: ROIData | null;
}

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<CourseStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const coursesData = await apiFetch<{ courses: Course[] }>("/courses");
        const results: CourseStrategy[] = [];

        for (const course of coursesData.courses) {
          let prediction: PredictionData | null = null;
          let roi: ROIData | null = null;
          try {
            prediction = await apiFetch<PredictionData>(
              `/predictions/${course.id}`
            );
          } catch {}
          try {
            roi = await apiFetch<ROIData>(`/predictions/${course.id}/roi`);
          } catch {}
          results.push({ course, prediction, roi });
        }

        results.sort(
          (a, b) =>
            (a.prediction?.pass_probability ?? 0) -
            (b.prediction?.pass_probability ?? 0)
        );
        setStrategies(results);
      } catch {}
      setIsLoading(false);
    };
    load();
  }, []);

  const recommendedOrder = [...strategies]
    .sort(
      (a, b) =>
        (b.prediction?.pass_probability ?? 0) -
        (a.prediction?.pass_probability ?? 0)
    )
    .map((s) => s.course.code);

  const totalRemainingHours = strategies.reduce(
    (sum, s) => sum + (s.roi?.estimated_hours_remaining ?? 0),
    0
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-zinc-500 text-sm animate-pulse">戦略分析中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <PageHeader
          title="受験戦略パネル"
          description="3資格の最適受験順序と時間配分を提案"
          tooltip="学習データから各資格の合格確率・予測スコアを算出します。合格確率が高い資格から順に受験することで、合格実績がモチベーションとなり、資格間のシナジー効果も最大化できます。"
        />

        {/* Purpose explanation */}
        <div className="bg-blue-950/15 border border-blue-900/25 rounded-xl p-4 text-sm text-zinc-400 space-y-1.5">
          <p>
            <strong className="text-blue-400/80">このページの目的：</strong>
            学習データを基に各資格の合格確率・予測スコアを算出し、最も効率的な受験順序と学習時間配分を提案します。
          </p>
          <p className="text-xs text-zinc-600">
            合格確率が高い資格から順に受験することで、合格実績がモチベーションとなり、資格間のシナジー効果（共通知識の活用）も最大化できます。
          </p>
        </div>

        {/* Recommended order */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6 space-y-4">
          <h2 className="text-base font-semibold text-zinc-200">推奨受験順序</h2>
          <div className="flex items-center gap-4 justify-center py-4">
            {recommendedOrder.map((code, i) => {
              const s = strategies.find((s) => s.course.code === code);
              return (
                <div key={code} className="flex items-center gap-3">
                  <div className="text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: s?.course.color }}
                    >
                      {code}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 tabular-nums">
                      {Math.round(s?.prediction?.pass_probability ?? 0)}%
                    </div>
                  </div>
                  {i < recommendedOrder.length - 1 && (
                    <ArrowRight size={18} className="text-zinc-700" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center text-xs text-zinc-600">
            合格確率が高い資格から受験 → シナジー効果を最大化
          </div>
        </div>

        {/* Summary stats */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="tooltip-trigger">
              <div className="text-2xl font-bold text-blue-400 tabular-nums">
                {Math.round(totalRemainingHours)}h
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">推定残り学習時間</div>
              <span className="tooltip-content">未習得カードを全て学習するのに必要な推定時間です。</span>
            </div>
            <div className="tooltip-trigger">
              <div className="text-2xl font-bold text-zinc-200 tabular-nums">
                {strategies.reduce(
                  (sum, s) => sum + (s.roi?.mastered_cards ?? 0),
                  0
                )}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">習得済みカード</div>
              <span className="tooltip-content">FSRS評価でGood以上を一定回数以上獲得したカード数です。</span>
            </div>
            <div className="tooltip-trigger">
              <div className="text-2xl font-bold text-orange-400 tabular-nums">
                {strategies.reduce(
                  (sum, s) => sum + (s.roi?.remaining_cards ?? 0),
                  0
                )}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">残りカード</div>
              <span className="tooltip-content">まだ習得に至っていないカード数です。学習を続けて減らしましょう。</span>
            </div>
          </div>
        </div>

        {/* Per-course strategy cards */}
        {strategies.map((s) => (
          <div
            key={s.course.id}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: s.course.color }}
              >
                {s.course.code}
              </span>
              <span className="text-sm text-zinc-400">{s.course.name}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-3 tooltip-trigger">
                <div className="text-zinc-500">合格確率</div>
                <div
                  className="text-xl font-bold tabular-nums"
                  style={{ color: s.course.color }}
                >
                  {Math.round(s.prediction?.pass_probability ?? 0)}%
                </div>
                <span className="tooltip-content">現在の学習データから算出した本試験の合格確率</span>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-3 tooltip-trigger">
                <div className="text-zinc-500">予測スコア</div>
                <div className="text-xl font-bold tabular-nums text-zinc-200">
                  {s.prediction?.predicted_score ?? 0}点
                </div>
                <span className="tooltip-content">SRSカードの習得率と正答率から予測した試験スコア</span>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-3 tooltip-trigger">
                <div className="text-zinc-500">残り学習時間</div>
                <div className="text-xl font-bold tabular-nums text-zinc-200">
                  {s.roi?.estimated_hours_remaining ?? 0}h
                </div>
                <span className="tooltip-content">未習得カードを全て学習するのに必要な推定時間</span>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-3 tooltip-trigger">
                <div className="text-zinc-500">進捗</div>
                <div className="text-xl font-bold tabular-nums text-zinc-200">
                  {s.roi
                    ? Math.round(
                        (s.roi.mastered_cards / Math.max(s.roi.total_cards, 1)) *
                          100
                      )
                    : 0}
                  %
                </div>
                <span className="tooltip-content">全カードのうち習得済みカードの割合</span>
              </div>
            </div>

            {/* Card progress bar */}
            {s.roi && (
              <div>
                <div className="flex justify-between text-xs text-zinc-600 mb-1">
                  <span className="tabular-nums">
                    {s.roi.mastered_cards}/{s.roi.total_cards} カード習得
                  </span>
                  <span className="tabular-nums">残り {s.roi.remaining_cards} 枚</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(s.roi.mastered_cards / Math.max(s.roi.total_cards, 1)) * 100}%`,
                      backgroundColor: s.course.color,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Weak topics */}
            {s.prediction && s.prediction.weak_topics.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs text-zinc-500 font-medium">
                  優先改善トピック
                </div>
                {s.prediction.weak_topics.slice(0, 3).map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs bg-zinc-800/40 border border-zinc-700/30 rounded-lg px-3 py-1.5"
                  >
                    <span className="text-orange-400 font-medium w-4">
                      #{i + 1}
                    </span>
                    <span className="flex-1 text-zinc-400">{t.topic_name}</span>
                    <div className="w-16 h-1.5 bg-zinc-700 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${t.mastery_score * 100}%`,
                          backgroundColor: s.course.color,
                        }}
                      />
                    </div>
                    <span className="text-zinc-600 w-8 text-right tabular-nums">
                      {Math.round(t.mastery_score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendation */}
            {s.prediction?.recommendation && (
              <div className="text-xs text-zinc-500 bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-3">
                {s.prediction.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
