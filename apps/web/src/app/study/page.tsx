"use client";

import { useEffect } from "react";
import AppLayout from "@/components/layout/app-layout";
import Flashcard from "@/components/study/flashcard";
import RatingButtons from "@/components/study/rating-buttons";
import StudyProgress from "@/components/study/study-progress";
import { useStudySession } from "@/hooks/use-study-session";

export default function StudyPage() {
  const {
    currentCard,
    isFlipped,
    isLoading,
    error,
    correct,
    reviewed,
    cards,
    sessionComplete,
    flipCard,
    submitRating,
    refetch,
  } = useStudySession();

  // キーボードショートカット: Space=flip, 1-4=rating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flipCard();
      }
      if (isFlipped && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        submitRating(Number(e.key) as 1 | 2 | 3 | 4);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipCard, submitRating, isFlipped]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 text-lg animate-pulse">
            カードを読み込み中...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-red-400">{error}</div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm"
          >
            再試行
          </button>
        </div>
      </AppLayout>
    );
  }

  if (sessionComplete) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">セッション完了</h2>
            <p className="text-gray-400">
              {reviewed}枚のカードを復習しました
            </p>
            {reviewed > 0 && (
              <p className="text-2xl">
                正答率:{" "}
                <span className="font-bold text-blue-400">
                  {Math.round((correct / reviewed) * 100)}%
                </span>
              </p>
            )}
          </div>
          <button
            onClick={refetch}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
          >
            次のセッションを開始
          </button>
        </div>
      </AppLayout>
    );
  }

  if (!currentCard) return null;

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center p-8 gap-6">
        <h1 className="text-2xl font-bold tracking-tight">学習セッション</h1>

        <StudyProgress
          current={reviewed}
          total={cards.length}
          correct={correct}
        />

        <Flashcard
          card={currentCard}
          onFlip={() => flipCard()}
        />

        {isFlipped && (
          <RatingButtons onRate={submitRating} />
        )}

        <div className="text-xs text-gray-600 mt-4 space-y-1 text-center">
          <div>ショートカット: Space=フリップ, 1=Again, 2=Hard, 3=Good, 4=Easy</div>
          <div className="text-gray-700">
            <span title="全く思い出せなかった → すぐ再表示">1:Again</span>{" / "}
            <span title="思い出せたが自信がない → 短い間隔で復習">2:Hard</span>{" / "}
            <span title="正しく思い出せた → 通常間隔で復習">3:Good</span>{" / "}
            <span title="即座に思い出せた → 長い間隔で復習">4:Easy</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
