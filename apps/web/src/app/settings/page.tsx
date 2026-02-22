"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api-client";
import { Plus, Trash2, Save } from "lucide-react";

interface Enrollment {
  id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  course_color: string;
  desired_retention: number;
  is_active: boolean;
  enrolled_at: string;
}

interface CourseInfo {
  id: string;
  code: string;
  name: string;
  color: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const loadData = async () => {
    setError(null);
    try {
      const [enrollData, courseData] = await Promise.all([
        apiFetch<{ enrollments: Enrollment[] }>("/enrollments"),
        apiFetch<{ courses: CourseInfo[] }>("/courses?include_all=true"),
      ]);
      setEnrollments(enrollData.enrollments);
      setCourses(courseData.courses);
    } catch (e) {
      setError(e instanceof Error ? e.message : "データの取得に失敗しました");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnroll = async (courseId: string) => {
    try {
      await apiFetch("/enrollments", {
        method: "POST",
        body: JSON.stringify({ course_id: courseId }),
      });
      setMessage("コースに登録しました");
      await loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "登録に失敗しました");
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateRetention = async (
    enrollmentId: string,
    retention: number
  ) => {
    try {
      await apiFetch(`/enrollments/${enrollmentId}/retention`, {
        method: "PUT",
        body: JSON.stringify({ desired_retention: retention }),
      });
      setMessage("目標記憶率を更新しました");
      await loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "更新に失敗しました");
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUnenroll = async (enrollmentId: string) => {
    try {
      await apiFetch(`/enrollments/${enrollmentId}`, {
        method: "DELETE",
      });
      setMessage("登録を解除しました");
      await loadData();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "解除に失敗しました");
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordError("新しいパスワードは8文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("新しいパスワードが一致しません");
      return;
    }

    try {
      await apiFetch("/auth/password", {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setPasswordMessage("パスワードを変更しました");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPasswordError(
        e instanceof Error ? e.message : "パスワード変更に失敗しました"
      );
    }
    setTimeout(() => {
      setPasswordMessage(null);
      setPasswordError(null);
    }, 5000);
  };

  const enrolledCourseIds = new Set(
    enrollments.filter((e) => e.is_active).map((e) => e.course_id)
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-zinc-500 text-sm animate-pulse">読み込み中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="設定"
          description="コース登録・学習設定"
          tooltip="学習する資格の登録・解除、目標記憶率の調整、パスワード変更を行います。"
        />

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 text-blue-400 text-sm">
            {message}
          </div>
        )}

        {/* Enrolled courses */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
          <h2 className="text-base font-semibold text-zinc-200 mb-4">登録コース</h2>
          <div className="space-y-3">
            {enrollments
              .filter((e) => e.is_active)
              .map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-xl border p-4 flex items-center justify-between"
                  style={{ borderColor: enrollment.course_color + "30" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2 py-1 rounded text-[11px] font-semibold text-white"
                      style={{ backgroundColor: enrollment.course_color }}
                    >
                      {enrollment.course_code}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">
                        {enrollment.course_name}
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        登録日:{" "}
                        {new Date(enrollment.enrolled_at).toLocaleDateString(
                          "ja-JP"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right tooltip-trigger">
                      <label className="text-[11px] text-zinc-600 block">
                        目標記憶率
                      </label>
                      <select
                        value={enrollment.desired_retention}
                        onChange={(e) =>
                          handleUpdateRetention(
                            enrollment.id,
                            parseFloat(e.target.value)
                          )
                        }
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/60"
                      >
                        <option value={0.8}>80%</option>
                        <option value={0.85}>85%</option>
                        <option value={0.9}>90% (推奨)</option>
                        <option value={0.95}>95%</option>
                      </select>
                      <span className="tooltip-content">復習時に正しく思い出せる確率の目標値。高いほど復習頻度が上がります。</span>
                    </div>
                    <button
                      onClick={() => handleUnenroll(enrollment.id)}
                      className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition"
                      title="登録解除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

            {enrollments.filter((e) => e.is_active).length === 0 && (
              <p className="text-zinc-600 text-sm text-center py-4">
                まだコースに登録されていません
              </p>
            )}
          </div>
        </div>

        {/* Available courses */}
        {courses.filter((c) => !enrolledCourseIds.has(c.id)).length > 0 && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
            <h2 className="text-base font-semibold text-zinc-200 mb-4">利用可能なコース</h2>
            <div className="space-y-2">
              {courses
                .filter((c) => !enrolledCourseIds.has(c.id))
                .map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-zinc-700/40 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-1 rounded text-[11px] font-semibold text-white"
                        style={{ backgroundColor: course.color }}
                      >
                        {course.code}
                      </span>
                      <span className="text-sm text-zinc-300">{course.name}</span>
                    </div>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus size={14} />
                      登録
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Password change */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
          <h2 className="text-base font-semibold text-zinc-200 mb-4">パスワード変更</h2>
          {passwordMessage && (
            <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-3 text-emerald-400 text-sm mb-4">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="bg-red-950/40 border border-red-900/60 rounded-lg p-3 text-red-400 text-sm mb-4">
              {passwordError}
            </div>
          )}
          <div className="space-y-3 max-w-sm">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="現在のパスワード"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/60 transition-colors placeholder:text-zinc-600"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワード（8文字以上）"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/60 transition-colors placeholder:text-zinc-600"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="新しいパスワード（確認）"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/60 transition-colors placeholder:text-zinc-600"
            />
            <button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              パスワードを変更
            </button>
          </div>
        </div>

        {/* FSRS explanation */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
          <h2 className="text-base font-semibold text-zinc-200 mb-3">学習アルゴリズムについて</h2>
          <div className="space-y-3 text-sm text-zinc-500">
            <p>
              本アプリはFSRS（Free Spaced Repetition Scheduler）を使用しています。
            </p>
            <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-4 space-y-2">
              <p>
                <strong className="text-zinc-300">目標記憶率</strong>:
                復習時に正しく思い出せる確率の目標値
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-500">
                <li>80%: 復習頻度低。忙しい方向け</li>
                <li>85%: バランス型</li>
                <li>90%: 推奨値。確実な定着を目指す</li>
                <li>95%: 高頻度復習。試験直前向け</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
