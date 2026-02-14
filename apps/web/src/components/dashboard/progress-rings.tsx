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
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#1f2937"
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
          <span className="text-lg font-bold">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {courseCode}
        </span>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-400 space-y-1 w-full">
        <div className="flex justify-between">
          <span>習得</span>
          <span>
            {mastered}/{totalCards}
          </span>
        </div>
        <div className="flex justify-between">
          <span>本日復習</span>
          <span>{dueToday}枚</span>
        </div>
        <div className="flex justify-between">
          <span>合格確率</span>
          <span className="font-semibold" style={{ color }}>
            {Math.round(passProbability * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
