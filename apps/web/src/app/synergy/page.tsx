"use client";

import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import Flashcard from "@/components/study/flashcard";
import RatingButtons from "@/components/study/rating-buttons";
import { apiFetch } from "@/lib/api-client";
import { COURSE_COLORS } from "@/lib/constants";
import { RotateCcw, Play } from "lucide-react";

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

const CERT_OPTIONS = [
  { code: "CIA", label: "CIA", color: "#e94560" },
  { code: "CISA", label: "CISA", color: "#0891b2" },
  { code: "CFE", label: "CFE", color: "#7c3aed" },
];

export default function SynergyPage() {
  const [cards, setCards] = useState<SynergyCard[]>([]);
  const [areas, setAreas] = useState<SynergyArea[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [started, setStarted] = useState(false);

  const [selectedCerts, setSelectedCerts] = useState<string[]>(["CIA", "CISA", "CFE"]);
  const [cardCount, setCardCount] = useState(10);

  useEffect(() => {
    apiFetch<{ synergy_areas: SynergyArea[] }>("/synergy/areas")
      .then((data) => setAreas(data.synergy_areas))
      .catch(() => {});
  }, []);

  const startSession = async () => {
    if (selectedCerts.length === 0) return;
    setIsLoading(true);
    setCards([]);
    setCurrentIdx(0);
    setIsFlipped(false);
    setReviewed(0);
    setCorrect(0);

    try {
      const courseParam = selectedCerts.join(",");
      const data = await apiFetch<{ cards: SynergyCard[] }>(
        `/synergy/study?limit=${cardCount}&course_code=${courseParam}`
      );
      setCards(data.cards);
      setStarted(true);
    } catch {
      // pass
    }
    setIsLoading(false);
  };

  const currentCard = cards[currentIdx];
  const isComplete = started && currentIdx >= cards.length && cards.length > 0;

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!started || isComplete) return;
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
  }, [isFlipped, handleRate, started, isComplete]);

  const toggleCert = (code: string) => {
    setSelectedCerts((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="シナジー学習"
          description="資格共通テーマで横断的に学習"
          tooltip="CIA/CISA/CFEに共通するテーマ（リスク管理、内部統制、ガバナンス等）のカードをまとめて学習します。一度の学習で複数資格の知識を同時に強化できます。"
        />

        {/* Synergy area tags */}
        <div className="flex flex-wrap gap-2">
          {areas.slice(0, 8).map((area, i) => (
            <div
              key={i}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800/60 rounded-full text-xs flex items-center gap-2"
            >
              <span className="text-zinc-300">{area.area_name}</span>
              <span className="text-zinc-600">{area.overlap_pct}%</span>
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

        {/* Setup panel */}
        {!started && !isLoading && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">対象資格を選択</p>
              <div className="flex gap-2 justify-center">
                {CERT_OPTIONS.map((cert) => (
                  <button
                    key={cert.code}
                    onClick={() => toggleCert(cert.code)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCerts.includes(cert.code)
                        ? "text-white"
                        : "text-zinc-600 bg-zinc-800 border border-zinc-700"
                    }`}
                    style={
                      selectedCerts.includes(cert.code)
                        ? { backgroundColor: cert.color }
                        : {}
                    }
                  >
                    {cert.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 text-center font-medium">カード枚数</p>
              <div className="flex gap-2 justify-center">
                {[5, 10, 15, 20, 30, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCardCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      cardCount === n
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    {n}枚
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={startSession}
                disabled={selectedCerts.length === 0}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={14} />
                シナジー学習を開始
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-zinc-500 text-sm animate-pulse">シナジーカードを読み込み中...</div>
          </div>
        )}

        {/* Complete */}
        {isComplete && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8 text-center space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
              シナジー学習完了
            </h2>
            <p className="text-zinc-500 text-sm">{reviewed}枚のカードを横断学習しました</p>
            {reviewed > 0 && (
              <p className="text-xl">
                正答率:{" "}
                <span className="font-bold text-blue-400">
                  {Math.round((correct / reviewed) * 100)}%
                </span>
              </p>
            )}
            <button
              onClick={() => {
                setStarted(false);
                setCards([]);
                setCurrentIdx(0);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-colors"
            >
              <RotateCcw size={14} />
              もう一度
            </button>
          </div>
        )}

        {/* Active study */}
        {started && !isComplete && currentCard && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-zinc-800 rounded-full">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-cyan-500 to-purple-500 transition-all"
                  style={{ width: `${(currentIdx / cards.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500 tabular-nums">
                {currentIdx + 1}/{cards.length}
              </span>
            </div>

            {/* Course badges */}
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                style={{ backgroundColor: currentCard.course_color }}
              >
                {currentCard.course_code}
              </span>
              {currentCard.is_synergy && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gradient-to-r from-red-500 via-cyan-500 to-purple-500 text-white">
                  SYNERGY
                </span>
              )}
              {currentCard.tags?.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-500"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Flashcard
              card={{
                id: currentCard.id,
                front: currentCard.front,
                back: currentCard.back,
              }}
              isFlipped={isFlipped}
              onFlip={(flipped) => setIsFlipped(flipped)}
            />

            {isFlipped && <RatingButtons onRate={handleRate} />}

            <div className="text-xs text-zinc-600 text-center">
              Space = フリップ, 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
            </div>
          </div>
        )}

        {/* No cards found */}
        {started && !isLoading && cards.length === 0 && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8 text-center space-y-4">
            <p className="text-zinc-500 text-sm">選択した資格のシナジーカードが見つかりません</p>
            <button
              onClick={() => setStarted(false)}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm transition-colors"
            >
              設定に戻る
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
