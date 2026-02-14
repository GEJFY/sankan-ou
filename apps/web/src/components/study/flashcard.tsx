"use client";

import { useState } from "react";

interface FlashcardCard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardProps {
  card: FlashcardCard;
  onFlip?: (isFlipped: boolean) => void;
}

export default function Flashcard({ card, onFlip }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    const next = !isFlipped;
    setIsFlipped(next);
    onFlip?.(next);
  };

  return (
    <div
      className="perspective-1000 w-full max-w-2xl mx-auto cursor-pointer"
      onClick={handleFlip}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") handleFlip();
      }}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? "裏面を表示中。クリックで表面へ" : "表面を表示中。クリックで裏面へ"}
    >
      <div
        className={`relative w-full min-h-[300px] transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-2xl border border-gray-700 bg-gray-900 p-8 flex flex-col justify-center">
          <div className="text-xs text-gray-500 mb-4 uppercase tracking-wider">
            Question
          </div>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {card.front}
          </p>
          <div className="mt-6 text-sm text-gray-500 text-center">
            クリックまたはスペースキーで裏面表示
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-gray-700 bg-gray-800 p-8 flex flex-col justify-center">
          <div className="text-xs text-gray-500 mb-4 uppercase tracking-wider">
            Answer
          </div>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {card.back}
          </p>
        </div>
      </div>
    </div>
  );
}
