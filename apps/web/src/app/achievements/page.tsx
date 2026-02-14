"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { apiFetch } from "@/lib/api-client";

interface Mission {
  id: string;
  type: string;
  title: string;
  target: number;
  current: number;
  xp_reward: number;
  is_completed: boolean;
  progress_pct: number;
}

interface BadgeInfo {
  code: string;
  name: string;
  icon: string;
  earned_at: string;
}

interface XPHistoryEntry {
  amount: number;
  source: string;
  detail: string | null;
  earned_at: string;
}

interface GamificationProfile {
  total_xp: number;
  level: number;
  xp_to_next: number;
  xp_progress_pct: number;
  course_xp: { CIA: number; CISA: number; CFE: number };
  badges: BadgeInfo[];
  badge_count: number;
  daily_missions: Mission[];
}

const COURSE_COLORS: Record<string, string> = {
  CIA: "#e94560",
  CISA: "#0891b2",
  CFE: "#7c3aed",
};

export default function AchievementsPage() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [xpHistory, setXpHistory] = useState<XPHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileData, historyData] = await Promise.all([
          apiFetch<GamificationProfile>("/gamification/profile"),
          apiFetch<{ history: XPHistoryEntry[] }>("/gamification/xp/history"),
        ]);
        setProfile(profileData);
        setXpHistory(historyData.history);
      } catch {
        // pass
      }
      setIsLoading(false);
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 animate-pulse">読み込み中...</div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center text-gray-400 py-20">
          プロフィールの読み込みに失敗しました
        </div>
      </AppLayout>
    );
  }

  const maxCourseXP = Math.max(
    profile.course_xp.CIA,
    profile.course_xp.CISA,
    profile.course_xp.CFE,
    1
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">実績 / ゲーミフィケーション</h1>
          <p className="text-gray-500 mt-1">XP・バッジ・デイリーミッション</p>
        </div>

        {/* XPとレベル */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-2xl font-bold">
                {profile.level}
              </div>
              <div>
                <div className="text-sm text-gray-400">レベル {profile.level}</div>
                <div className="text-2xl font-bold">
                  {profile.total_xp.toLocaleString()} XP
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">次のレベルまで</div>
              <div className="text-lg font-semibold text-yellow-400">
                {profile.xp_to_next.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* XP進捗バー */}
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
              style={{ width: `${Math.min(100, profile.xp_progress_pct)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {Math.round(profile.xp_progress_pct)}%
          </div>

          {/* 資格別XP */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(["CIA", "CISA", "CFE"] as const).map((code) => (
              <div key={code} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: COURSE_COLORS[code] }}>{code}</span>
                  <span className="text-gray-500">
                    {profile.course_xp[code].toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(profile.course_xp[code] / maxCourseXP) * 100}%`,
                      backgroundColor: COURSE_COLORS[code],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* デイリーミッション */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">
            今日のミッション
            <span className="ml-2 text-sm text-gray-500">
              {profile.daily_missions.filter((m) => m.is_completed).length}/
              {profile.daily_missions.length} 完了
            </span>
          </h2>
          <div className="space-y-3">
            {profile.daily_missions.map((mission) => (
              <div
                key={mission.id}
                className={`rounded-xl border p-4 ${
                  mission.is_completed
                    ? "border-green-800 bg-green-900/20"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {mission.is_completed ? "✅" : "📋"}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        mission.is_completed
                          ? "text-green-400 line-through"
                          : "text-gray-200"
                      }`}
                    >
                      {mission.title}
                    </span>
                  </div>
                  <span className="text-xs text-yellow-400 font-semibold">
                    +{mission.xp_reward} XP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-700 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        mission.is_completed
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${mission.progress_pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {mission.current}/{mission.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* バッジコレクション */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">
            バッジコレクション
            <span className="ml-2 text-sm text-gray-500">
              {profile.badge_count} 獲得
            </span>
          </h2>
          {profile.badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.badges.map((badge) => (
                <div
                  key={badge.code}
                  className="bg-gray-800 rounded-xl p-4 text-center space-y-2 border border-gray-700"
                >
                  <div className="text-3xl">{badge.icon}</div>
                  <div className="text-sm font-semibold">{badge.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(badge.earned_at).toLocaleDateString("ja-JP")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🏅</div>
              <p className="text-gray-400 text-sm">
                学習を進めてバッジを獲得しよう
              </p>
              <p className="text-gray-600 text-xs mt-1">
                カードレビュー、連続学習、シナジー学習で解放されます
              </p>
            </div>
          )}
        </div>

        {/* XP履歴 */}
        {xpHistory.length > 0 && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold mb-4">最近のXP獲得</h2>
            <div className="space-y-2">
              {xpHistory.slice(0, 10).map((entry, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0"
                >
                  <div>
                    <span className="text-sm text-gray-300">
                      {entry.source.replace(/_/g, " ")}
                    </span>
                    {entry.detail && (
                      <span className="ml-2 text-xs text-gray-500">
                        {entry.detail}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-yellow-400">
                    +{entry.amount} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
