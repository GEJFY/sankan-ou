"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api-client";
import { Award, CheckCircle2, ClipboardList } from "lucide-react";

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
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-zinc-500 text-sm animate-pulse">読み込み中...</div>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center text-zinc-500 py-20 text-sm">
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
        <PageHeader
          title="実績"
          description="XP・バッジ・デイリーミッション"
          tooltip="学習するとXP（経験値）が獲得でき、レベルが上がります。デイリーミッションの達成やバッジ解放でモチベーションを維持しましょう。"
        />

        {/* XP and Level */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl font-bold text-white">
                {profile.level}
              </div>
              <div>
                <div className="text-xs text-zinc-500">レベル {profile.level}</div>
                <div className="text-xl font-bold text-zinc-200 tabular-nums">
                  {profile.total_xp.toLocaleString()} XP
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-zinc-600">次のレベルまで</div>
              <div className="text-base font-semibold text-amber-400 tabular-nums">
                {profile.xp_to_next.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* XP progress bar */}
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
              style={{ width: `${Math.min(100, profile.xp_progress_pct)}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-600 mt-1 text-right tabular-nums">
            {Math.round(profile.xp_progress_pct)}%
          </div>

          {/* Per-course XP */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(["CIA", "CISA", "CFE"] as const).map((code) => (
              <div key={code} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: COURSE_COLORS[code] }}>{code}</span>
                  <span className="text-zinc-600 tabular-nums">
                    {profile.course_xp[code].toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full">
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

        {/* Daily missions */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={16} className="text-zinc-500" />
            <h2 className="text-base font-semibold text-zinc-200">
              今日のミッション
            </h2>
            <span className="text-xs text-zinc-600 tabular-nums">
              {profile.daily_missions.filter((m) => m.is_completed).length}/
              {profile.daily_missions.length} 完了
            </span>
          </div>
          <div className="space-y-2.5">
            {profile.daily_missions.map((mission) => (
              <div
                key={mission.id}
                className={`rounded-xl border p-4 ${
                  mission.is_completed
                    ? "border-emerald-800/30 bg-emerald-950/20"
                    : "border-zinc-700/40 bg-zinc-800/40"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {mission.is_completed ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <ClipboardList size={16} className="text-zinc-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        mission.is_completed
                          ? "text-emerald-400 line-through"
                          : "text-zinc-300"
                      }`}
                    >
                      {mission.title}
                    </span>
                  </div>
                  <span className="text-xs text-amber-400/80 font-medium tabular-nums">
                    +{mission.xp_reward} XP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-zinc-700 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${
                        mission.is_completed
                          ? "bg-emerald-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${mission.progress_pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 tabular-nums">
                    {mission.current}/{mission.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badge collection */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-zinc-500" />
            <h2 className="text-base font-semibold text-zinc-200">
              バッジコレクション
            </h2>
            <span className="text-xs text-zinc-600 tabular-nums">
              {profile.badge_count} 獲得
            </span>
          </div>
          {profile.badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.badges.map((badge) => (
                <div
                  key={badge.code}
                  className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4 text-center space-y-2"
                >
                  <div className="text-2xl">{badge.icon}</div>
                  <div className="text-sm font-medium text-zinc-300">{badge.name}</div>
                  <div className="text-[11px] text-zinc-600">
                    {new Date(badge.earned_at).toLocaleDateString("ja-JP")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award size={32} className="mx-auto text-zinc-700 mb-3" />
              <p className="text-zinc-500 text-sm">
                学習を進めてバッジを獲得しよう
              </p>
              <p className="text-zinc-600 text-xs mt-1">
                カードレビュー、連続学習、シナジー学習で解放されます
              </p>
            </div>
          )}
        </div>

        {/* XP history */}
        {xpHistory.length > 0 && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
            <h2 className="text-base font-semibold text-zinc-200 mb-4">最近のXP獲得</h2>
            <div className="space-y-1.5">
              {xpHistory.slice(0, 10).map((entry, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-zinc-800/60 last:border-0"
                >
                  <div>
                    <span className="text-sm text-zinc-400">
                      {entry.source.replace(/_/g, " ")}
                    </span>
                    {entry.detail && (
                      <span className="ml-2 text-[11px] text-zinc-600">
                        {entry.detail}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-amber-400/80 tabular-nums">
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
