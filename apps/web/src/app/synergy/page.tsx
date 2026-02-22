"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import Flashcard from "@/components/study/flashcard";
import RatingButtons from "@/components/study/rating-buttons";
import { apiFetch } from "@/lib/api-client";
import { COURSE_COLORS } from "@/lib/constants";

interface SynergyCard {
  id: string;
  front: string;
  back: string;
  course_code: string;
  course_color: string;
  is_synergy: boolean;
  difficulty_tier: number;
  tags: string[] | null;
}

interface SynergyArea {
  area_name: string;
  overlap_pct: number;
  courses: string[];
  term_mappings: Record<string, string>;
}

export default function SynergyPage() {
  const [cards, setCards] = useState<SynergyCard[]>([]);
  const [areas, setAreas] = useState<SynergyArea[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [cardsData, areasData] = await Promise.all([
          apiFetch<{ cards: SynergyCard[] }>("/synergy/study?limit=20"),
          apiFetch<{ synergy_areas: SynergyArea[] }>("/synergy/areas"),
        ]);
        setCards(cardsData.cards);
        setAreas(areasData.synergy_areas);
      } catch {
        // pass
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const currentCard = cards[currentIdx];
  const isComplete = currentIdx >= cards.length && cards.length > 0;

  const handleRate = useCallback(async (rating: 1 | 2 | 3 | 4) => {
    if (!currentCard) return;
    if (rating >= 3) setCorrect((c) => c + 1);
    setReviewed((r) => r + 1);

    try {
      await apiFetch("/cards/review", {
        method: "POST",
        body: JSON.stringify({
          card_id: currentCard.id,
          rating,
        }),
      });
    } catch {
      // pass
    }

    setIsFlipped(false);
    setCurrentIdx((i) => i + 1);
  }, [currentCard]);

  // キーボードショートカット
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      }
      if (isFlipped && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        handleRate(Number(e.key) as 1 | 2 | 3 | 4);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFlipped, handleRate]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400 animate-pulse">シナジーカードを読み込み中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">シナジー学習</h1>
          <p className="text-gray-500 mt-1">
            資格共通テーマで横断的に学習
          </p>
        </div>

        {/* シナジー領域タグ */}
        <div className="flex flex-wrap gap-2">
          {areas.slice(0, 8).map((area, i) => (
            <div
              key={i}
              className="px-3 py-1.5 bg-gray-800 rounded-full text-xs flex items-center gap-2"
            >
              <span>{area.area_name}</span>
              <span className="text-gray-500">{area.overlap_pct}%</span>
              <div className="flex gap-0.5">
                {area.courses.map((code) => (
                  <span
                    key={code}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: COURSE_COLORS[code] ?? "#666",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {isComplete ? (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">シナジー学習完了</h2>
            <p className="text-gray-400">{reviewed}枚のカードを横断学習しました</p>
            {reviewed > 0 && (
              <p className="text-2xl">
                正答率:{" "}
                <span className="font-bold text-blue-400">
                  {Math.round((correct / reviewed) * 100)}%
                </span>
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
            >
              もう一度
            </button>
          </div>
        ) : currentCard ? (
          <div className="space-y-6">
            {/* 進捗 */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-800 rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-cyan-500 to-purple-500 transition-all"
                  style={{ width: `${(currentIdx / cards.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">
                {currentIdx + 1}/{cards.length}
              </span>
            </div>

            {/* カード資格バッジ */}
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-bold text-white"
                style={{ backgroundColor: currentCard.course_color }}
              >
                {currentCard.course_code}
              </span>
              {currentCard.is_synergy && (
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-red-500 via-cyan-500 to-purple-500 text-white">
                  SYNERGY
                </span>
              )}
              {currentCard.tags?.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* フラッシュカード */}
            <Flashcard
              card={{
                id: currentCard.id,
                front: currentCard.front,
                back: currentCard.back,
              }}
              onFlip={() => setIsFlipped(!isFlipped)}
            />

            {isFlipped && <RatingButtons onRate={handleRate} />}

            <div className="text-xs text-gray-600 text-center">
              Space=フリップ, 1=Again, 2=Hard, 3=Good, 4=Easy
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
            <p className="text-gray-400">シナジーカードが見つかりません</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
