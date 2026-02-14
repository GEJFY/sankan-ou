"use client";

interface StudyProgressProps {
  current: number;
  total: number;
  correct: number;
}

export default function StudyProgress({ current, total, correct }: StudyProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const accuracy = current > 0 ? Math.round((correct / current) * 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>
          {current} / {total} カード
        </span>
        <span>正答率: {accuracy}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
