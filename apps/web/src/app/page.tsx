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

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
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
        {dashboard && dashboard.courses.length > 0 && (
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
      </div>
    </AppLayout>
  );
}
