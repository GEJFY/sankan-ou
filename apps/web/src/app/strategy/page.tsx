"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { apiFetch } from "@/lib/api-client";

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

        // 合格確率が低い順 (最も改善が必要な順)
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

  // 推奨受験順序
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
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 animate-pulse">戦略分析中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">受験戦略パネル</h1>
          <p className="text-gray-500 mt-1">
            3資格の最適受験順序と時間配分を提案
          </p>
        </div>

        {/* 目的説明 */}
        <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 text-sm text-gray-300 space-y-2">
          <p>
            <strong className="text-blue-400">このページの目的：</strong>
            学習データを基に各資格の合格確率・予測スコアを算出し、最も効率的な受験順序と学習時間配分を提案します。
          </p>
          <p className="text-xs text-gray-500">
            合格確率が高い資格から順に受験することで、合格実績がモチベーションとなり、資格間のシナジー効果（共通知識の活用）も最大化できます。
          </p>
        </div>

        {/* 推奨受験順序 */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold">推奨受験順序</h2>
          <div className="flex items-center gap-4 justify-center py-4">
            {recommendedOrder.map((code, i) => {
              const s = strategies.find((s) => s.course.code === code);
              return (
                <div key={code} className="flex items-center gap-3">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: s?.course.color }}
                    >
                      {code}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.round(s?.prediction?.pass_probability ?? 0)}%
                    </div>
                  </div>
                  {i < recommendedOrder.length - 1 && (
                    <span className="text-2xl text-gray-600">→</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center text-sm text-gray-400">
            合格確率が高い資格から受験することで、シナジー効果を最大化
          </div>
        </div>

        {/* 残り学習時間サマリー */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">
                {Math.round(totalRemainingHours)}h
              </div>
              <div className="text-xs text-gray-500">推定残り学習時間</div>
            </div>
            <div>
              <div className="text-3xl font-bold">
                {strategies.reduce(
                  (sum, s) => sum + (s.roi?.mastered_cards ?? 0),
                  0
                )}
              </div>
              <div className="text-xs text-gray-500">習得済みカード</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">
                {strategies.reduce(
                  (sum, s) => sum + (s.roi?.remaining_cards ?? 0),
                  0
                )}
              </div>
              <div className="text-xs text-gray-500">残りカード</div>
            </div>
          </div>
        </div>

        {/* 各資格の詳細戦略 */}
        {strategies.map((s) => (
          <div
            key={s.course.id}
            className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: s.course.color }}
              >
                {s.course.code}
              </span>
              <span className="text-sm text-gray-300">{s.course.name}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-800 rounded-lg p-3" title="現在の学習データから算出した本試験の合格確率">
                <div className="text-gray-500">合格確率</div>
                <div
                  className="text-xl font-bold"
                  style={{ color: s.course.color }}
                >
                  {Math.round(s.prediction?.pass_probability ?? 0)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3" title="SRSカードの習得率と正答率から予測した試験スコア">
                <div className="text-gray-500">予測スコア</div>
                <div className="text-xl font-bold">
                  {s.prediction?.predicted_score ?? 0}点
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3" title="未習得カードを全て学習するのに必要な推定時間">
                <div className="text-gray-500">残り学習時間</div>
                <div className="text-xl font-bold">
                  {s.roi?.estimated_hours_remaining ?? 0}h
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3" title="全カードのうち習得済みカードの割合">
                <div className="text-gray-500">進捗</div>
                <div className="text-xl font-bold">
                  {s.roi
                    ? Math.round(
                        (s.roi.mastered_cards / Math.max(s.roi.total_cards, 1)) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>

            {/* カード進捗バー */}
            {s.roi && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {s.roi.mastered_cards}/{s.roi.total_cards} カード習得
                  </span>
                  <span>残り {s.roi.remaining_cards} 枚</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full">
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

            {/* 弱点トピック */}
            {s.prediction && s.prediction.weak_topics.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 font-semibold">
                  優先改善トピック
                </div>
                {s.prediction.weak_topics.slice(0, 3).map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs bg-gray-800 rounded px-3 py-1.5"
                  >
                    <span className="text-orange-400 font-bold w-4">
                      #{i + 1}
                    </span>
                    <span className="flex-1">{t.topic_name}</span>
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${t.mastery_score * 100}%`,
                          backgroundColor: s.course.color,
                        }}
                      />
                    </div>
                    <span className="text-gray-500 w-8 text-right">
                      {Math.round(t.mastery_score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 推奨アクション */}
            {s.prediction?.recommendation && (
              <div className="text-xs text-gray-400 bg-gray-800 rounded-lg p-3">
                {s.prediction.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
