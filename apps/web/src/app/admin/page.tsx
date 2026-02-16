"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";

interface SystemStats {
  users: { total: number; active: number };
  content: { courses: number; topics: number; cards: number; reviews: number };
  plugins: { registered: number; codes: string[] };
  synergy: { total_areas: number; avg_overlap: number };
}

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
}

interface AdminCourse {
  id: string | null;
  code: string;
  name: string;
  color: string;
  is_active: boolean;
  topic_count: number;
  card_count: number;
  has_plugin: boolean;
  in_db?: boolean;
  plugin_info: {
    course_name: string;
    description: string;
    icon: string;
    exam_questions: number;
    exam_duration_min: number;
    passing_score: number;
    synergy_count: number;
  } | null;
}

type Tab = "overview" | "users" | "courses";

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await apiFetch<SystemStats>("/admin/stats");
        setStats(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "管理データ取得に失敗");
      }
      setLoading(false);
    };
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await apiFetch<{ users: AdminUser[] }>("/admin/users");
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ユーザー取得に失敗");
    }
  };

  const loadCourses = async () => {
    try {
      const data = await apiFetch<{ courses: AdminCourse[] }>("/admin/courses");
      setCourses(data.courses);
    } catch (e) {
      setError(e instanceof Error ? e.message : "コース取得に失敗");
    }
  };

  useEffect(() => {
    if (tab === "users" && users.length === 0) loadUsers();
    if (tab === "courses" && courses.length === 0) loadCourses();
  }, [tab]);

  if (user?.role !== "admin") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-8 text-center">
            <h2 className="text-xl font-bold text-red-400">アクセス拒否</h2>
            <p className="text-gray-400 mt-2">管理者権限が必要です</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 animate-pulse">管理データを読み込み中...</div>
        </div>
      </AppLayout>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "概要", icon: "📊" },
    { key: "users", label: "ユーザー", icon: "👥" },
    { key: "courses", label: "コース", icon: "📚" },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">管理画面</h1>
          <p className="text-gray-500 mt-1">システム管理・統計情報</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300">
            {error}
          </div>
        )}

        {/* タブ */}
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* 概要タブ */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="総ユーザー数" value={stats.users.total} sub={`アクティブ: ${stats.users.active}`} />
              <StatCard label="コース数" value={stats.content.courses} sub={`プラグイン: ${stats.plugins.registered}`} />
              <StatCard label="カード数" value={stats.content.cards} sub={`トピック: ${stats.content.topics}`} />
              <StatCard label="総レビュー数" value={stats.content.reviews} sub="全ユーザー合計" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">登録プラグイン</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.plugins.codes.map((code) => (
                    <span
                      key={code}
                      className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm font-medium"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">シナジー情報</h3>
                <div className="space-y-2">
                  <p className="text-gray-400">
                    シナジー領域: <span className="text-white font-semibold">{stats.synergy.total_areas}</span>
                  </p>
                  <p className="text-gray-400">
                    平均重複率: <span className="text-white font-semibold">{stats.synergy.avg_overlap}%</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ユーザータブ */}
        {tab === "users" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">名前</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">メール</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">ロール</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">状態</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">登録日</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3">{u.display_name}</td>
                    <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-purple-900/50 text-purple-300"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${
                          u.is_active ? "bg-green-500" : "bg-gray-600"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("ja-JP") : "-"}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      ユーザーが見つかりません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* コースタブ */}
        {tab === "courses" && (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.code}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{course.code}</h3>
                        <span className="text-gray-400 text-sm">{course.name}</span>
                        {course.plugin_info && (
                          <span className="text-lg">{course.plugin_info.icon}</span>
                        )}
                      </div>
                      {course.plugin_info && (
                        <p className="text-xs text-gray-500 mt-1">
                          {course.plugin_info.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {course.has_plugin && (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-900/50 text-green-300">
                        Plugin
                      </span>
                    )}
                    {course.id ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300">
                        DB登録済
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-300">
                        未登録
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500">トピック数</p>
                    <p className="font-semibold">{course.topic_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">カード数</p>
                    <p className="font-semibold">{course.card_count}</p>
                  </div>
                  {course.plugin_info && (
                    <>
                      <div>
                        <p className="text-gray-500">試験問題数</p>
                        <p className="font-semibold">{course.plugin_info.exam_questions}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">合格ライン</p>
                        <p className="font-semibold">{Math.round(course.plugin_info.passing_score * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">シナジー領域</p>
                        <p className="font-semibold">{course.plugin_info.synergy_count}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {courses.length === 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-500">コースが見つかりません</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
    </div>
  );
}
