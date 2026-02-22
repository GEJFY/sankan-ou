"use client";

import { useEffect } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import Flashcard from "@/components/study/flashcard";
import RatingButtons from "@/components/study/rating-buttons";
import StudyProgress from "@/components/study/study-progress";
import { useStudySession } from "@/hooks/use-study-session";
import { RotateCcw } from "lucide-react";

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
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-zinc-500 text-sm animate-pulse">
            カードを読み込み中...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="text-red-400 text-sm">{error}</div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm transition-colors"
          >
            <RotateCcw size={14} />
            再試行
          </button>
        </div>
      </AppLayout>
    );
  }

  if (sessionComplete) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
              セッション完了
            </h2>
            <p className="text-zinc-500 text-sm">
              {reviewed}枚のカードを復習しました
            </p>
            {reviewed > 0 && (
              <p className="text-xl">
                正答率:{" "}
                <span className="font-bold text-blue-400">
                  {Math.round((correct / reviewed) * 100)}%
                </span>
              </p>
            )}
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-colors"
          >
            <RotateCcw size={14} />
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
        <PageHeader
          title="SRS学習"
          description="間隔反復アルゴリズム（FSRS）で効率的に記憶定着"
          tooltip="FSRSアルゴリズムが各カードの最適な復習タイミングを計算します。評価に応じて次回の復習間隔が調整されます。"
        />

        <StudyProgress
          current={reviewed}
          total={cards.length}
          correct={correct}
        />

        <Flashcard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={() => flipCard()}
        />

        {isFlipped && (
          <RatingButtons onRate={submitRating} />
        )}

        <div className="text-xs text-zinc-600 mt-4 space-y-1.5 text-center">
          <div className="text-zinc-500">
            ショートカット: Space = フリップ, 1-4 = 評価
          </div>
          <div className="flex gap-4 justify-center text-[11px]">
            <span className="tooltip-trigger cursor-help text-red-400/70">
              1: Again
              <span className="tooltip-content">全く思い出せなかった。すぐに再表示されます。</span>
            </span>
            <span className="tooltip-trigger cursor-help text-orange-400/70">
              2: Hard
              <span className="tooltip-content">思い出せたが自信がない。短い間隔で復習します。</span>
            </span>
            <span className="tooltip-trigger cursor-help text-blue-400/70">
              3: Good
              <span className="tooltip-content">正しく思い出せた。通常の間隔で復習します。</span>
            </span>
            <span className="tooltip-trigger cursor-help text-emerald-400/70">
              4: Easy
              <span className="tooltip-content">即座に思い出せた。長い間隔で復習します。</span>
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
