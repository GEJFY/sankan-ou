"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api-client";
import { Play, ChevronRight, RotateCcw } from "lucide-react";

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
  const [questionCount, setQuestionCount] = useState(5);
  const [source, setSource] = useState<"auto" | "generate">("auto");

  useEffect(() => {
    apiFetch<{ courses: Course[] }>("/courses")
      .then((data) => {
        setCourses(data.courses);
        if (data.courses.length > 0) setSelectedCourse(data.courses[0].id);
      })
      .catch(() => setError("コース取得に失敗しました"));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setTopics([]);
    setSelectedTopic("");
    apiFetch<{ topics: Topic[] }>(`/courses/${selectedCourse}/topics`)
      .then((data) => {
        setTopics(data.topics);
        if (data.topics.length > 0) {
          const idx = Math.floor(Math.random() * data.topics.length);
          setSelectedTopic(data.topics[idx].id);
        }
      })
      .catch(() => {});
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
      let allQuestions: Question[] = [];

      if (source === "auto") {
        try {
          const bankData = await apiFetch<{ questions: Question[] }>(
            `/questions/bank?topic_id=${selectedTopic}&count=${questionCount}`
          );
          allQuestions = bankData.questions;
        } catch {
          // DB問題が取得できなくても続行
        }
      }

      if (allQuestions.length < questionCount) {
        const remaining = questionCount - allQuestions.length;
        const genData = await apiFetch<{ questions: Question[] }>(
          "/questions/generate",
          {
            method: "POST",
            body: JSON.stringify({
              topic_id: selectedTopic,
              count: remaining,
              difficulty: 2,
            }),
          }
        );
        allQuestions = [...allQuestions, ...genData.questions];
      }

      setQuestions(allQuestions);
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
        <PageHeader
          title="問題演習"
          description="トピック別の四肢択一問題で実力確認"
          tooltip="DB保存済み問題を優先的に出題し、不足分はAIがリアルタイムで生成します。「AI生成のみ」モードでは全問を新規生成します。"
        />

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Setup panel */}
        {questions.length === 0 && !isGenerating && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8 space-y-6">
            <p className="text-zinc-500 text-center text-sm">コースとトピックを選択して問題を生成</p>

            {/* Course selection */}
            <div className="flex gap-3 justify-center flex-wrap">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedCourse === course.id
                      ? "text-white"
                      : "text-zinc-500 bg-zinc-800 border border-zinc-700"
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

            {/* Topic selection */}
            {topics.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 text-center font-medium">トピック</p>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/60 transition-colors"
                >
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Question count */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 text-center font-medium">問題数</p>
              <div className="flex gap-2 justify-center">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      questionCount === n
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    {n}問
                  </button>
                ))}
              </div>
            </div>

            {/* Source mode */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setSource("auto")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  source === "auto"
                    ? "bg-zinc-700 text-zinc-200"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
                title="DB保存済み問題を優先し、不足分をAI生成"
              >
                自動（DB優先）
              </button>
              <button
                onClick={() => setSource("generate")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  source === "generate"
                    ? "bg-zinc-700 text-zinc-200"
                    : "text-zinc-600 hover:text-zinc-400"
                }`}
                title="全問をAIで新規生成"
              >
                AI生成のみ
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={generateQuestions}
                disabled={!selectedTopic}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={14} />
                {questionCount}問を開始
              </button>
            </div>
          </div>
        )}

        {/* Generating */}
        {isGenerating && (
          <div className="text-center py-20">
            <div className="animate-pulse text-zinc-500 text-sm">
              AI が問題を生成中...
            </div>
          </div>
        )}

        {/* Question display */}
        {question && !isComplete && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8 space-y-6">
            <div className="flex justify-between text-sm text-zinc-500">
              <span className="tabular-nums">
                Q{currentQ + 1} / {questions.length}
              </span>
              <span className="flex items-center gap-1">
                {"difficulty" in question && (
                  <span className="text-yellow-500/70">
                    {"★".repeat(question.difficulty)}
                    <span className="text-zinc-700">{"★".repeat(Math.max(0, 3 - question.difficulty))}</span>
                  </span>
                )}
              </span>
            </div>

            <p className="text-[15px] leading-relaxed text-zinc-200">{question.stem}</p>

            <div className="space-y-2.5">
              {question.choices.map((choice, i) => {
                const letter = String.fromCharCode(65 + i);
                let borderClass = "border-zinc-700/60";
                let bgClass = "bg-zinc-800/40 hover:bg-zinc-800/70";

                if (showResult) {
                  if (choice.is_correct) {
                    borderClass = "border-emerald-600/60";
                    bgClass = "bg-emerald-950/30";
                  } else if (i === selectedAnswer) {
                    borderClass = "border-red-600/60";
                    bgClass = "bg-red-950/30";
                  }
                } else if (i === selectedAnswer) {
                  borderClass = "border-blue-500/60";
                  bgClass = "bg-blue-950/30";
                }

                return (
                  <button
                    key={i}
                    onClick={() => !showResult && setSelectedAnswer(i)}
                    disabled={showResult}
                    className={`w-full text-left px-4 py-3 rounded-xl border ${borderClass} ${bgClass} transition-all text-sm`}
                  >
                    <span className="font-medium text-zinc-400 mr-2">{letter}.</span>
                    <span className="text-zinc-200">{choice.text}</span>
                    {showResult && choice.explanation && (
                      <p className="text-xs text-zinc-500 mt-1.5 ml-5">
                        {choice.explanation}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {showResult && question.explanation && (
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4 text-sm text-zinc-400">
                <p className="font-medium text-zinc-300 mb-1 text-xs uppercase tracking-wider">解説</p>
                {question.explanation}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {!showResult ? (
                <button
                  onClick={submitAnswer}
                  disabled={selectedAnswer === null}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
                >
                  回答する
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="inline-flex items-center gap-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-colors"
                >
                  次の問題
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Complete */}
        {isComplete && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8 text-center space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">演習完了</h2>
            <p className="text-4xl font-bold text-blue-400 tabular-nums">
              {score.correct} / {score.total}
            </p>
            <p className="text-zinc-500 text-sm">
              正答率: {Math.round((score.correct / score.total) * 100)}%
            </p>
            <button
              onClick={() => {
                setQuestions([]);
                setCurrentQ(0);
                setScore({ correct: 0, total: 0 });
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-colors"
            >
              <RotateCcw size={14} />
              もう一度
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
