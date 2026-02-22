"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { apiFetch } from "@/lib/api-client";

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
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 animate-pulse">読み込み中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">設定</h1>
          <p className="text-gray-500 mt-1">コース登録・学習設定</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 text-blue-300 text-sm">
            {message}
          </div>
        )}

        {/* 登録済みコース */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">登録コース</h2>
          <div className="space-y-4">
            {enrollments
              .filter((e) => e.is_active)
              .map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-xl border p-4 flex items-center justify-between"
                  style={{ borderColor: enrollment.course_color + "60" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: enrollment.course_color }}
                    >
                      {enrollment.course_code}
                    </span>
                    <div>
                      <div className="text-sm font-medium">
                        {enrollment.course_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        登録日:{" "}
                        {new Date(enrollment.enrolled_at).toLocaleDateString(
                          "ja-JP"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <label className="text-xs text-gray-500 block">
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
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                      >
                        <option value={0.8}>80%</option>
                        <option value={0.85}>85%</option>
                        <option value={0.9}>90% (推奨)</option>
                        <option value={0.95}>95%</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleUnenroll(enrollment.id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                    >
                      解除
                    </button>
                  </div>
                </div>
              ))}

            {enrollments.filter((e) => e.is_active).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">
                まだコースに登録されていません
              </p>
            )}
          </div>
        </div>

        {/* 未登録コース */}
        {courses.filter((c) => !enrolledCourseIds.has(c.id)).length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">利用可能なコース</h2>
            <div className="space-y-3">
              {courses
                .filter((c) => !enrolledCourseIds.has(c.id))
                .map((course) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-gray-700 p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: course.color }}
                      >
                        {course.code}
                      </span>
                      <span className="text-sm">{course.name}</span>
                    </div>
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold"
                    >
                      登録
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* パスワード変更 */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">パスワード変更</h2>
          {passwordMessage && (
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-3 text-green-300 text-sm mb-4">
              {passwordMessage}
            </div>
          )}
          {passwordError && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-300 text-sm mb-4">
              {passwordError}
            </div>
          )}
          <div className="space-y-3 max-w-sm">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="現在のパスワード"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワード（8文字以上）"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="新しいパスワード（確認）"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              パスワードを変更
            </button>
          </div>
        </div>

        {/* FSRS設定説明 */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-3">学習アルゴリズムについて</h2>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              本アプリはFSRS（Free Spaced Repetition Scheduler）を使用しています。
            </p>
            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
              <p>
                <strong className="text-gray-200">目標記憶率</strong>:
                復習時に正しく思い出せる確率の目標値
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
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
