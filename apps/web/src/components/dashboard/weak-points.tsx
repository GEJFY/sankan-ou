"use client";

interface WeakTopic {
  topic_id: string;
  topic_name: string;
  course_code: string;
  color: string;
  mastery_score: number;
  total_cards: number;
  failed_cards: number;
}

interface WeakPointsProps {
  topics: WeakTopic[];
}

export default function WeakPoints({ topics }: WeakPointsProps) {
  if (topics.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          弱点トピック
        </h3>
        <p className="text-gray-500 text-sm">まだデータがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        弱点トピック TOP5
      </h3>

      <div className="space-y-3">
        {topics.map((topic) => (
          <div key={topic.topic_id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: topic.color }}
                />
                <span className="text-gray-300 truncate max-w-[200px]">
                  {topic.topic_name}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                {Math.round(topic.mastery_score * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${topic.mastery_score * 100}%`,
                  backgroundColor: topic.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
