"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import ProgressRing from "@/components/dashboard/progress-rings";
import TodayTasks from "@/components/dashboard/today-tasks";
import WeakPoints from "@/components/dashboard/weak-points";
import PassProbability from "@/components/dashboard/pass-probability";
import SynergyMap from "@/components/dashboard/synergy-map";
import StudyHistory from "@/components/dashboard/study-history";
import StreakBadge from "@/components/dashboard/streak-badge";
import { apiFetch } from "@/lib/api-client";
import { COURSE_COLORS } from "@/lib/constants";
import {
  BookOpen,
  PenLine,
  FileCheck2,
  Settings as SettingsIcon,
} from "lucide-react";

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

const ONBOARDING_STEPS = [
  { step: "1", label: "設定", desc: "学習する資格を登録", href: "/settings", icon: SettingsIcon },
  { step: "2", label: "SRS学習", desc: "フラッシュカードで基礎知識を記憶", href: "/study", icon: BookOpen },
  { step: "3", label: "問題演習", desc: "トピック別の問題で実力チェック", href: "/quiz", icon: PenLine },
  { step: "4", label: "模擬試験", desc: "本番形式で合格力を測定", href: "/mock-exam", icon: FileCheck2 },
];

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
        <PageHeader
          title="ダッシュボード"
          description="GRC Triple Crown — 資格同時合格への進捗"
          tooltip="登録済みの各資格について、カード習得率・合格確率・本日の復習予定を一覧表示します。"
        />

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Onboarding guide */}
        {dashboard && dashboard.courses.length === 0 && (
          <div className="bg-gradient-to-r from-blue-950/30 via-indigo-950/20 to-violet-950/30 border border-blue-900/30 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-zinc-200">はじめに</h2>
              <p className="text-sm text-zinc-400 mt-1">
                GRC Triple Crown へようこそ。以下のステップで学習を開始しましょう。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {ONBOARDING_STEPS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.step}
                    href={s.href}
                    className="group bg-zinc-900/60 border border-zinc-800/50 rounded-xl p-4 hover:border-blue-800/40 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-blue-400/80 bg-blue-950/40 px-1.5 py-0.5 rounded">
                        Step {s.step}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-1.5">{s.desc}</p>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Course progress rings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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

        {/* Today stats + tasks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StreakBadge />
          <TodayTasks
            totalDue={totalDue}
            studiedToday={dashboard?.total_studied_today ?? 0}
          />
          <WeakPoints topics={weakTopics} />
        </div>

        {/* Pass probability */}
        {dashboard && dashboard.courses.length > 0 && dashboard.courses.some(c => c.total_cards > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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

        {/* Synergy map + study history */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SynergyMap />
          <StudyHistory />
        </div>

        {/* Recent mock exams */}
        {mockExams.length > 0 && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-zinc-200">最近の模擬試験</h2>
              <span className="tooltip-trigger">
                <span className="text-zinc-600 cursor-help text-xs">[?]</span>
                <span className="tooltip-content">過去に受験した模擬試験のスコアと合否結果を表示します。</span>
              </span>
            </div>
            <div className="space-y-2">
              {mockExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between bg-zinc-800/40 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                      style={{
                        backgroundColor: COURSE_COLORS[exam.course_code] ?? "#666",
                      }}
                    >
                      {exam.course_code}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {exam.correct_count}/{exam.total_questions}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg font-bold ${
                        exam.passed ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {Math.round(exam.score_pct)}%
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        exam.passed
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
                          : "bg-red-950/40 text-red-400 border border-red-800/30"
                      }`}
                    >
                      {exam.passed ? "合格" : "不合格"}
                    </span>
                    <span className="text-xs text-zinc-600">
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
