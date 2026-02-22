"use client";

interface ProgressRingProps {
  courseCode: string;
  color: string;
  totalCards: number;
  mastered: number;
  dueToday: number;
  passProbability: number;
}

export default function ProgressRing({
  courseCode,
  color,
  totalCards,
  mastered,
  dueToday,
  passProbability,
}: ProgressRingProps) {
  const progress = totalCards > 0 ? (mastered / totalCards) * 100 : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6 flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#27272a"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-zinc-200 tabular-nums">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {courseCode}
        </span>
      </div>

      {/* Stats */}
      <div className="text-sm text-zinc-500 space-y-1 w-full">
        <div className="flex justify-between tooltip-trigger">
          <span>習得</span>
          <span className="text-zinc-300 tabular-nums">
            {mastered}/{totalCards}
          </span>
          <span className="tooltip-content">FSRS評価でGood以上を獲得し、習得と判定されたカード数</span>
        </div>
        <div className="flex justify-between tooltip-trigger">
          <span>本日復習</span>
          <span className="text-zinc-300 tabular-nums">{dueToday}枚</span>
          <span className="tooltip-content">FSRSが算出した今日復習すべきカード数</span>
        </div>
        <div className="flex justify-between tooltip-trigger">
          <span>合格確率</span>
          <span className="font-semibold tabular-nums" style={{ color }}>
            {Math.round(passProbability * 100)}%
          </span>
          <span className="tooltip-content">カード習得率と正答率から算出した合格確率の予測値</span>
        </div>
      </div>
    </div>
  );
}
