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
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
          弱点トピック
        </h3>
        <p className="text-zinc-600 text-sm">まだデータがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          弱点トピック TOP5
        </h3>
        <span className="tooltip-trigger">
          <span className="text-zinc-700 cursor-help text-[10px]">[?]</span>
          <span className="tooltip-content">正答率が低いトピックを優先表示。集中的に復習することで効率的にスコアアップできます。</span>
        </span>
      </div>

      <div className="space-y-3">
        {topics.map((topic) => (
          <div key={topic.topic_id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: topic.color }}
                />
                <span className="text-zinc-400 truncate max-w-[200px]">
                  {topic.topic_name}
                </span>
              </div>
              <span className="text-zinc-600 text-xs tabular-nums">
                {Math.round(topic.mastery_score * 100)}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1">
              <div
                className="h-1 rounded-full transition-all"
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
