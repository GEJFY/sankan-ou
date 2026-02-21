"use client";

import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/layout/app-layout";
import { apiFetch } from "@/lib/api-client";
import { COURSE_COLORS } from "@/lib/constants";

interface ExamConfig {
  course_code: string;
  course_name: string;
  total_questions: number;
  duration_minutes: number;
  passing_score: number;
  sections: { name: string; weight_pct?: number }[];
  format_notes: string;
}

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

interface CourseInfo {
  id: string;
  code: string;
  name: string;
  color: string;
}

interface TopicInfo {
  id: string;
  name: string;
}

type ExamPhase = "setup" | "running" | "review" | "result";

export default function MockExamPage() {
  const [phase, setPhase] = useState<ExamPhase>("setup");
  const [courseList, setCourseList] = useState<CourseInfo[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // コース一覧取得
  useEffect(() => {
    apiFetch<{ courses: CourseInfo[] }>("/courses")
      .then((data) => {
        setCourseList(data.courses);
        if (data.courses.length > 0) setSelectedCourse(data.courses[0].code);
      })
      .catch(() => {});
  }, []);

  // 試験設定 + トピック取得
  useEffect(() => {
    if (!selectedCourse) return;
    apiFetch<ExamConfig>(`/mock-exam/config/${selectedCourse}`)
      .then(setConfig)
      .catch(() => {});
    const course = courseList.find((c) => c.code === selectedCourse);
    if (course) {
      apiFetch<{ topics: TopicInfo[] }>(`/courses/${course.id}/topics`)
        .then((data) => setTopics(data.topics))
        .catch(() => setTopics([]));
    }
  }, [selectedCourse, courseList]);

  // タイマー
  useEffect(() => {
    if (phase === "running" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setPhase("result");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current!);
    }
  }, [phase]);

  const startExam = async () => {
    if (topics.length === 0) {
      setError("トピックが見つかりません。コースのシードデータを確認してください。");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      // ランダムにトピックを選択
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const data = await apiFetch<{ questions: Question[] }>(
        "/questions/generate",
        {
          method: "POST",
          body: JSON.stringify({
            topic_id: topic.id,
            count: questionCount,
            difficulty: 3,
          }),
        }
      );
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
      const duration = config?.duration_minutes
        ? Math.min(config.duration_minutes, questionCount * 2)
        : questionCount * 2;
      setTimeLeft(duration * 60);
      setPhase("running");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "問題生成に失敗しました。APIキーを確認してください。"
      );
    }
    setIsGenerating(false);
  };

  const selectAnswer = (qIdx: number, choiceIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = choiceIdx;
    setAnswers(newAnswers);
  };

  const submitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("result");
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // 結果計算
  const correctCount = questions.reduce((sum, q, i) => {
    const ans = answers[i];
    if (ans !== null && q.choices[ans]?.is_correct) return sum + 1;
    return sum;
  }, 0);
  const scorePercent =
    questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
  const passed = config ? scorePercent >= config.passing_score : false;
  const courseColor = COURSE_COLORS[selectedCourse] ?? "#666";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">模擬試験</h1>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Setup Phase */}
        {phase === "setup" && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-6">
            <h2 className="text-xl font-semibold">試験設定</h2>

            {/* コース選択 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">資格を選択</label>
              <div className="flex gap-3 flex-wrap">
                {courseList.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCourse(c.code)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      selectedCourse === c.code
                        ? "text-white scale-105"
                        : "text-gray-400 bg-gray-800"
                    }`}
                    style={
                      selectedCourse === c.code
                        ? { backgroundColor: COURSE_COLORS[c.code] ?? c.color }
                        : {}
                    }
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* 問題数 */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">問題数</label>
              <div className="flex gap-2">
                {[5, 10, 25, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      questionCount === n
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {n}問
                  </button>
                ))}
              </div>
            </div>

            {/* 試験情報 */}
            {config && (
              <div className="bg-gray-800 rounded-xl p-4 text-sm space-y-2">
                <div className="font-semibold" style={{ color: courseColor }}>
                  {config.course_name}
                </div>
                <div className="text-gray-400 text-xs">
                  {config.format_notes}
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs mt-2">
                  <div>
                    <span className="text-gray-500">本番問題数:</span>{" "}
                    {config.total_questions}問
                  </div>
                  <div>
                    <span className="text-gray-500">制限時間:</span>{" "}
                    {config.duration_minutes > 0
                      ? `${config.duration_minutes}分`
                      : "なし"}
                  </div>
                  <div>
                    <span className="text-gray-500">合格基準:</span>{" "}
                    {config.passing_score}%
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={startExam}
              disabled={isGenerating}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold disabled:opacity-50"
            >
              {isGenerating ? "AI が問題を生成中..." : "模擬試験を開始"}
            </button>
          </div>
        )}

        {/* Running Phase */}
        {phase === "running" && questions.length > 0 && (
          <div className="space-y-4">
            {/* ヘッダー: タイマー + 進捗 */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: courseColor }}
                >
                  {selectedCourse}
                </span>
                <span className="text-sm text-gray-400">
                  {currentQ + 1} / {questions.length}
                </span>
              </div>
              <div className="text-lg font-mono font-bold">
                {formatTime(timeLeft)}
              </div>
              <button
                onClick={submitExam}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold"
              >
                提出
              </button>
            </div>

            {/* 問題ナビ */}
            <div className="flex flex-wrap gap-1">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded text-xs font-semibold ${
                    i === currentQ
                      ? "bg-blue-600 text-white"
                      : answers[i] !== null
                        ? "bg-green-800 text-green-300"
                        : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* 問題 */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
              <p className="text-lg leading-relaxed">
                {questions[currentQ].stem}
              </p>

              <div className="space-y-2">
                {questions[currentQ].choices.map((choice, ci) => {
                  const letter = String.fromCharCode(65 + ci);
                  const isSelected = answers[currentQ] === ci;
                  return (
                    <button
                      key={ci}
                      onClick={() => selectAnswer(currentQ, ci)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-900/40 border-blue-500"
                          : "bg-gray-800 hover:bg-gray-700 border-gray-700"
                      }`}
                    >
                      <span className="font-semibold mr-2">{letter}.</span>
                      {choice.text}
                    </button>
                  );
                })}
              </div>

              {/* 前後ナビ */}
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                  disabled={currentQ === 0}
                  className="px-4 py-2 bg-gray-800 rounded-lg text-sm disabled:opacity-30"
                >
                  前の問題
                </button>
                <button
                  onClick={() =>
                    setCurrentQ(
                      Math.min(questions.length - 1, currentQ + 1)
                    )
                  }
                  disabled={currentQ === questions.length - 1}
                  className="px-4 py-2 bg-gray-800 rounded-lg text-sm disabled:opacity-30"
                >
                  次の問題
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Phase */}
        {phase === "result" && (
          <div className="space-y-6">
            {/* スコア */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold">試験結果</h2>
              <div
                className={`text-6xl font-bold ${passed ? "text-green-400" : "text-red-400"}`}
              >
                {Math.round(scorePercent)}%
              </div>
              <div className="text-xl">
                {correctCount} / {questions.length} 正解
              </div>
              <div
                className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  passed
                    ? "bg-green-900/40 text-green-400 border border-green-600"
                    : "bg-red-900/40 text-red-400 border border-red-600"
                }`}
              >
                {passed ? "合格" : "不合格"}（合格基準: {config?.passing_score}%）
              </div>
            </div>

            {/* 問題別レビュー */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">問題別レビュー</h3>
              {questions.map((q, i) => {
                const ans = answers[i];
                const isCorrect = ans !== null && q.choices[ans]?.is_correct;
                return (
                  <div
                    key={i}
                    className={`bg-gray-900 rounded-xl border p-4 space-y-2 ${
                      isCorrect ? "border-green-800" : "border-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`font-bold ${isCorrect ? "text-green-400" : "text-red-400"}`}
                      >
                        Q{i + 1}
                      </span>
                      <span className={isCorrect ? "text-green-400" : "text-red-400"}>
                        {isCorrect ? "正解" : "不正解"}
                      </span>
                    </div>
                    <p className="text-sm">{q.stem}</p>
                    <div className="text-xs text-gray-400 bg-gray-800 rounded p-2">
                      {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setPhase("setup");
                setQuestions([]);
                setAnswers([]);
                setCurrentQ(0);
              }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold"
            >
              新しい模擬試験
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
