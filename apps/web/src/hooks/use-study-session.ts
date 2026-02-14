"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardWithReview } from "@/types";
import { apiFetch } from "@/lib/api-client";

interface StudyState {
  cards: CardWithReview[];
  currentIndex: number;
  isFlipped: boolean;
  isLoading: boolean;
  error: string | null;
  correct: number;
  reviewed: number;
  sessionComplete: boolean;
}

interface ReviewResult {
  card_id: string;
  state: number;
  due: string;
  next_review_in_hours: number;
}

export function useStudySession(courseId?: string) {
  const [state, setState] = useState<StudyState>({
    cards: [],
    currentIndex: 0,
    isFlipped: false,
    isLoading: true,
    error: null,
    correct: 0,
    reviewed: 0,
    sessionComplete: false,
  });
  const startTimeRef = useRef<number>(Date.now());

  // カード取得
  const fetchCards = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const params = new URLSearchParams({ limit: "25" });
      if (courseId) params.set("course_id", courseId);

      const data = await apiFetch<{ cards: CardWithReview[]; total_due: number }>(
        `/cards/due?${params}`
      );
      setState((s) => ({
        ...s,
        cards: data.cards,
        currentIndex: 0,
        isLoading: false,
        sessionComplete: data.cards.length === 0,
      }));
    } catch (e) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: e instanceof Error ? e.message : "カード取得に失敗しました",
      }));
    }
  }, [courseId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const currentCard = state.cards[state.currentIndex] ?? null;

  // カードフリップ
  const flipCard = useCallback(() => {
    setState((s) => ({ ...s, isFlipped: !s.isFlipped }));
    startTimeRef.current = Date.now();
  }, []);

  // レビュー送信
  const submitRating = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (!currentCard) return;

      const responseTime = Date.now() - startTimeRef.current;

      try {
        await apiFetch<ReviewResult>("/cards/review", {
          method: "POST",
          body: JSON.stringify({
            card_id: currentCard.id,
            rating,
            response_time_ms: responseTime,
          }),
        });

        const isCorrect = rating >= 3;
        const nextIndex = state.currentIndex + 1;
        const isComplete = nextIndex >= state.cards.length;

        setState((s) => ({
          ...s,
          currentIndex: nextIndex,
          isFlipped: false,
          correct: s.correct + (isCorrect ? 1 : 0),
          reviewed: s.reviewed + 1,
          sessionComplete: isComplete,
        }));

        startTimeRef.current = Date.now();
      } catch (e) {
        setState((s) => ({
          ...s,
          error: e instanceof Error ? e.message : "レビュー送信に失敗しました",
        }));
      }
    },
    [currentCard, state.currentIndex, state.cards.length]
  );

  return {
    ...state,
    currentCard,
    flipCard,
    submitRating,
    refetch: fetchCards,
  };
}
