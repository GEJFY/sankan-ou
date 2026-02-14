"use client";

import { RATING_LABELS } from "@/lib/constants";

interface RatingButtonsProps {
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  disabled?: boolean;
}

const RATING_STYLES = {
  1: { bg: "bg-red-600 hover:bg-red-500", key: "1" },
  2: { bg: "bg-orange-600 hover:bg-orange-500", key: "2" },
  3: { bg: "bg-blue-600 hover:bg-blue-500", key: "3" },
  4: { bg: "bg-green-600 hover:bg-green-500", key: "4" },
} as const;

export default function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  return (
    <div className="flex gap-3 justify-center mt-6">
      {([1, 2, 3, 4] as const).map((rating) => (
        <button
          key={rating}
          onClick={() => onRate(rating)}
          disabled={disabled}
          className={`${RATING_STYLES[rating].bg} text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
        >
          <span className="block text-xs opacity-70 mb-0.5">
            {RATING_STYLES[rating].key}
          </span>
          {RATING_LABELS[rating]}
        </button>
      ))}
    </div>
  );
}
