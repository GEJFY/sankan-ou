"use client";

import { useEffect, useState } from "react";

interface FlashcardCard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardProps {
  card: FlashcardCard;
  isFlipped?: boolean;
  onFlip?: (isFlipped: boolean) => void;
}

export default function Flashcard({ card, isFlipped: controlledFlipped, onFlip }: FlashcardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  // Reset internal state when card changes
  useEffect(() => {
    setInternalFlipped(false);
  }, [card.id]);

  const handleFlip = () => {
    const next = !isFlipped;
    if (controlledFlipped === undefined) {
      setInternalFlipped(next);
    }
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
        <div className="absolute inset-0 backface-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 p-8 flex flex-col justify-center">
          <div className="text-[10px] text-zinc-600 mb-4 uppercase tracking-[0.1em] font-medium">
            Question
          </div>
          <p className="text-base leading-relaxed whitespace-pre-wrap text-zinc-200">
            {card.front}
          </p>
          <div className="mt-6 text-xs text-zinc-600 text-center">
            クリックまたはスペースキーで裏面表示
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-zinc-700/60 bg-zinc-800 p-8 flex flex-col justify-center">
          <div className="text-[10px] text-zinc-600 mb-4 uppercase tracking-[0.1em] font-medium">
            Answer
          </div>
          <p className="text-base leading-relaxed whitespace-pre-wrap text-zinc-200">
            {card.back}
          </p>
        </div>
      </div>
    </div>
  );
}
