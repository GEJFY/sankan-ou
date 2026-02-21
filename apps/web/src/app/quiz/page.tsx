"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { apiFetch } from "@/lib/api-client";
import { COURSE_COLORS } from "@/lib/constants";

interface Choice {
  text: string;
  is_correct: boolean;
  explanation: string;
}

interface Question {
  id: string;
  stem: string;
  choices: Choice[];
  explanation: string;
  difficulty: number;
  course_code: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  color: string;
}

interface Topic {
  id: string;
  name: string;
  course_id: string;
  level: number;
}

export default function QuizPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // コース一覧取得
  useEffect(() => {
    apiFetch<{ courses: Course[] }>("/courses")
      .then((data) => {
        setCourses(data.courses);
        if (data.courses.length > 0) setSelectedCourse(data.courses[0].id);
      })
      .catch(() => setError("コース取得に失敗しました"));
  }, []);

  // コース変更時にトピック一覧を取得
  useEffect(() => {
    if (!selectedCourse) return;
    setTopics([]);
    setSelectedTopic("");
    apiFetch<{ topics: Topic[] }>(`/courses/${selectedCourse}/topics`)
      .then((data) => {
        setTopics(data.topics);
        if (data.topics.length > 0) {
          // ランダムにトピックを選択
          const idx = Math.floor(Math.random() * data.topics.length);
          setSelectedTopic(data.topics[idx].id);
        }
      })
      .catch(() => {
        // トピック取得失敗は無視（コースがDBにない場合）
      });
  }, [selectedCourse]);

  const generateQuestions = async () => {
    if (!selectedCourse || !selectedTopic) {
      setError("トピックが見つかりません。コースのシードデータを確認してください。");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setQuestions([]);
    setCurrentQ(0);
    setScore({ correct: 0, total: 0 });

    try {
      const data = await apiFetch<{ questions: Question[] }>(
        "/questions/generate",
        {
          method: "POST",
          body: JSON.stringify({
            topic_id: selectedTopic,
            count: 5,
            difficulty: 2,
          }),
        }
      );
      setQuestions(data.questions);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "問題生成に失敗しました。APIキーを確認してください。"
      );
    }
    setIsGenerating(false);
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !questions[currentQ]) return;

    const question = questions[currentQ];
    const isCorrect = question.choices[selectedAnswer]?.is_correct ?? false;

    setShowResult(true);
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));

    try {
      await apiFetch("/questions/answer", {
        method: "POST",
        body: JSON.stringify({
          question_id: question.id,
          selected_index: selectedAnswer,
          response_time_ms: 0,
        }),
      });
    } catch {
      // 回答記録失敗は無視
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentQ((q) => q + 1);
  };

  const question = questions[currentQ];
  const isComplete = currentQ >= questions.length && questions.length > 0;
  const selectedCourseMeta = courses.find((c) => c.id === selectedCourse);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">問題演習</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* コース・トピック選択 + 生成ボタン */}
        {questions.length === 0 && !isGenerating && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-6">
            <p className="text-gray-400 text-center">コースとトピックを選択して問題を生成</p>

            {/* コース選択 */}
            <div className="flex gap-3 justify-center flex-wrap">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedCourse === course.id
                      ? "text-white scale-105"
                      : "text-gray-400 bg-gray-800"
                  }`}
                  style={
                    selectedCourse === course.id
                      ? { backgroundColor: course.color }
                      : {}
                  }
                >
                  {course.code}
                </button>
              ))}
            </div>

            {/* トピック選択 */}
            {topics.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">トピック</p>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={generateQuestions}
                disabled={!selectedTopic}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                5問を生成
              </button>
            </div>
          </div>
        )}

        {/* 生成中 */}
        {isGenerating && (
          <div className="text-center py-20">
            <div className="animate-pulse text-xl text-gray-400">
              AI が問題を生成中...
            </div>
          </div>
        )}

        {/* 問題表示 */}
        {question && !isComplete && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-6">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Q{currentQ + 1} / {questions.length}
              </span>
              <span>難易度: {"★".repeat(question.difficulty)}</span>
            </div>

            <p className="text-lg leading-relaxed">{question.stem}</p>

            <div className="space-y-3">
              {question.choices.map((choice, i) => {
                const letter = String.fromCharCode(65 + i); // A, B, C, D
                let bgClass = "bg-gray-800 hover:bg-gray-700 border-gray-700";

                if (showResult) {
                  if (choice.is_correct) {
                    bgClass = "bg-green-900/40 border-green-600";
                  } else if (i === selectedAnswer) {
                    bgClass = "bg-red-900/40 border-red-600";
                  }
                } else if (i === selectedAnswer) {
                  bgClass = "bg-blue-900/40 border-blue-500";
                }

                return (
                  <button
                    key={i}
                    onClick={() => !showResult && setSelectedAnswer(i)}
                    disabled={showResult}
                    className={`w-full text-left px-4 py-3 rounded-xl border ${bgClass} transition-colors text-sm`}
                  >
                    <span className="font-semibold mr-2">{letter}.</span>
                    {choice.text}
                    {showResult && (
                      <p className="text-xs text-gray-400 mt-1 ml-5">
                        {choice.explanation}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 解説 */}
            {showResult && question.explanation && (
              <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300">
                <p className="font-semibold text-gray-400 mb-1">解説:</p>
                {question.explanation}
              </div>
            )}

            {/* アクション */}
            <div className="flex justify-end gap-3">
              {!showResult ? (
                <button
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm disabled:opacity-50"
                >
                  回答する
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm"
                >
                  次の問題
                </button>
              )}
            </div>
          </div>
        )}

        {/* 完了 */}
        {isComplete && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">演習完了</h2>
            <p className="text-4xl font-bold text-blue-400">
              {score.correct} / {score.total}
            </p>
            <p className="text-gray-400">
              正答率: {Math.round((score.correct / score.total) * 100)}%
            </p>
            <button
              onClick={() => {
                setQuestions([]);
                setCurrentQ(0);
                setScore({ correct: 0, total: 0 });
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
            >
              もう一度
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
