"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import ProgressRing from "@/components/dashboard/progress-rings";
import TodayTasks from "@/components/dashboard/today-tasks";
import WeakPoints from "@/components/dashboard/weak-points";
import PassProbability from "@/components/dashboard/pass-probability";
import SynergyMap from "@/components/dashboard/synergy-map";
import StudyHistory from "@/components/dashboard/study-history";
import StreakBadge from "@/components/dashboard/streak-badge";
import { apiFetch } from "@/lib/api-client";
import { COURSE_COLORS } from "@/lib/constants";

interface CourseSummary {
  course_id: string;
  course_code: string;
  course_name: string;
  color: string;
  total_cards: number;
  mastered: number;
  due_today: number;
  pass_probability: number;
}

interface DashboardData {
  courses: CourseSummary[];
  total_studied_today: number;
  streak_days: number;
}

interface WeakTopic {
  topic_id: string;
  topic_name: string;
  course_code: string;
  color: string;
  mastery_score: number;
  total_cards: number;
  failed_cards: number;
}

interface MockExamResultItem {
  id: string;
  course_code: string;
  score_pct: number;
  correct_count: number;
  total_questions: number;
  passed: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [mockExams, setMockExams] = useState<MockExamResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [summary, weak] = await Promise.all([
          apiFetch<DashboardData>("/dashboard/summary"),
          apiFetch<{ topics: WeakTopic[] }>("/dashboard/weak-topics"),
        ]);
        setDashboard(summary);
        setWeakTopics(weak.topics);
      } catch (e) {
        setError(e instanceof Error ? e.message : "データ取得に失敗しました");
      }
      // 模試履歴は独立して取得（失敗してもOK）
      try {
        const examData = await apiFetch<{ results: MockExamResultItem[] }>(
          "/mock-exam/history?limit=5"
        );
        setMockExams(examData.results);
      } catch {
        // 模試履歴がなくてもダッシュボードは表示
      }
    };
    load();
  }, []);

  const totalDue =
    dashboard?.courses.reduce((sum, c) => sum + c.due_today, 0) ?? 0;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-gray-500 mt-1">GRC Triple Crown - 資格同時合格への進捗</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* はじめにガイド（データがない場合） */}
        {dashboard && dashboard.courses.length === 0 && (
          <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-cyan-900/30 border border-blue-800/50 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">はじめに</h2>
            <p className="text-sm text-gray-300">
              GRC Triple Crown へようこそ！以下の順序で学習を進めましょう。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { step: "1", label: "設定", desc: "学習したい資格を登録", href: "/settings" },
                { step: "2", label: "SRS学習", desc: "フラッシュカードで基礎知識を記憶", href: "/study" },
                { step: "3", label: "問題演習", desc: "トピック別の問題で実力チェック", href: "/quiz" },
                { step: "4", label: "模擬試験", desc: "本番形式で合格力を測定", href: "/mock-exam" },
              ].map((s) => (
                <a key={s.step} href={s.href} className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-700/50 transition group">
                  <div className="text-blue-400 font-bold text-lg mb-1">Step {s.step}</div>
                  <div className="text-sm font-semibold text-gray-200 group-hover:text-white">{s.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.desc}</div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 資格プログレスリング */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboard?.courses.map((course) => (
            <ProgressRing
              key={course.course_id}
              courseCode={course.course_code}
              color={course.color}
              totalCards={course.total_cards}
              mastered={course.mastered}
              dueToday={course.due_today}
              passProbability={course.pass_probability}
            />
          ))}
        </div>

        {/* 今日の統計 + タスク */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StreakBadge />
          <TodayTasks
            totalDue={totalDue}
            studiedToday={dashboard?.total_studied_today ?? 0}
          />
          <WeakPoints topics={weakTopics} />
        </div>

        {/* 合格確率予測 */}
        {dashboard && dashboard.courses.length > 0 && dashboard.courses.some(c => c.total_cards > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboard.courses.map((course) => (
              <PassProbability
                key={course.course_id}
                courseId={course.course_id}
                courseCode={course.course_code}
                color={course.color}
              />
            ))}
          </div>
        )}

        {/* シナジーマップ + 学習履歴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SynergyMap />
          <StudyHistory />
        </div>

        {/* 最近の模擬試験 */}
        {mockExams.length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4" title="過去に受験した模擬試験のスコアと合否結果">最近の模擬試験</h2>
            <div className="space-y-2">
              {mockExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold text-white"
                      style={{
                        backgroundColor:
                          COURSE_COLORS[exam.course_code] ?? "#666",
                      }}
                    >
                      {exam.course_code}
                    </span>
                    <span className="text-sm text-gray-400">
                      {exam.correct_count}/{exam.total_questions}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-bold ${
                        exam.passed ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {Math.round(exam.score_pct)}%
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        exam.passed
                          ? "bg-green-900/40 text-green-400"
                          : "bg-red-900/40 text-red-400"
                      }`}
                    >
                      {exam.passed ? "合格" : "不合格"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(exam.created_at).toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
