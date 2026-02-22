"use client";

import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api-client";
import { COURSE_COLORS } from "@/lib/constants";
import { Play, ChevronLeft, ChevronRight, Clock, Send, RotateCcw } from "lucide-react";

interface ExamSection {
  name: string;
  questions?: number;
  weight_pct?: number;
  duration_min?: number;
  part?: number;
  domain?: number;
  section?: number;
}

interface ExamConfig {
  course_code: string;
  course_name: string;
  total_questions: number;
  duration_minutes: number;
  passing_score: number;
  sections: ExamSection[];
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

type ExamPhase = "setup" | "running" | "result";

export default function MockExamPage() {
  const [phase, setPhase] = useState<ExamPhase>("setup");
  const [courseList, setCourseList] = useState<CourseInfo[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    apiFetch<{ courses: CourseInfo[] }>("/courses")
      .then((data) => {
        setCourseList(data.courses);
        if (data.courses.length > 0) setSelectedCourse(data.courses[0].code);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    apiFetch<ExamConfig>(`/mock-exam/config/${selectedCourse}`)
      .then((c) => {
        setConfig(c);
        setSelectedSection(null);
      })
      .catch(() => {});
    const course = courseList.find((c) => c.code === selectedCourse);
    if (course) {
      apiFetch<{ topics: TopicInfo[] }>(`/courses/${course.id}/topics`)
        .then((data) => setTopics(data.topics))
        .catch(() => setTopics([]));
    }
  }, [selectedCourse, courseList]);

  useEffect(() => {
    if (phase === "running" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            submitExam();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startExam = async () => {
    if (topics.length === 0) {
      setError("トピックが見つかりません。コースのシードデータを確認してください。");
      return;
    }
    setIsGenerating(true);
    setError(null);

    const effectiveCount = questionCount;

    try {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const data = await apiFetch<{ questions: Question[] }>(
        "/questions/generate",
        {
          method: "POST",
          body: JSON.stringify({
            topic_id: topic.id,
            count: effectiveCount,
            difficulty: 3,
          }),
        }
      );
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));

      const durationMin = Math.max(effectiveCount * 2, 10);
      setTimeLeft(durationMin * 60);
      startTimeRef.current = Date.now();
      setIsSaved(false);
      setPhase("running");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "問題生成に失敗しました。"
      );
    }
    setIsGenerating(false);
  };

  const selectAnswer = (qIdx: number, choiceIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = choiceIdx;
    setAnswers(newAnswers);
  };

  const submitExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("result");

    const course = courseList.find((c) => c.code === selectedCourse);
    if (!course) return;

    const correct = questions.reduce((sum, q, i) => {
      const ans = answers[i];
      if (ans !== null && q.choices[ans]?.is_correct) return sum + 1;
      return sum;
    }, 0);

    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      await apiFetch("/mock-exam/submit", {
        method: "POST",
        body: JSON.stringify({
          course_id: course.id,
          course_code: selectedCourse,
          total_questions: questions.length,
          correct_count: correct,
          passing_score_pct: config?.passing_score ?? 70,
          time_taken_seconds: timeTaken,
          question_ids: questions.map((q) => q.id),
          answer_indices: answers,
        }),
      });
      setIsSaved(true);
    } catch {
      // non-critical
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const correctCount = questions.reduce((sum, q, i) => {
    const ans = answers[i];
    if (ans !== null && q.choices[ans]?.is_correct) return sum + 1;
    return sum;
  }, 0);
  const scorePercent = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
  const passed = config ? scorePercent >= config.passing_score : false;
  const courseColor = COURSE_COLORS[selectedCourse] ?? "#666";

  const getSectionLabel = (sec: ExamSection) => {
    const id = sec.part ?? sec.domain ?? sec.section;
    const prefix = sec.part ? "Part" : sec.domain ? "Domain" : "Section";
    return `${prefix} ${id}: ${sec.name}`;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="模擬試験"
          description="各資格の本番形式に準拠した模擬試験"
          tooltip="本番の試験構成（パート・ドメイン・セクション）に基づいた問題をAIが生成します。制限時間内に全問回答し、合格基準に達するか確認しましょう。"
        />

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Setup Phase */}
        {phase === "setup" && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8 space-y-6">
            <h2 className="text-base font-semibold text-zinc-200">試験設定</h2>

            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-medium">資格を選択</label>
              <div className="flex gap-3 flex-wrap">
                {courseList.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCourse(c.code)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCourse === c.code
                        ? "text-white"
                        : "text-zinc-500 bg-zinc-800 border border-zinc-700"
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

            {/* Section selection */}
            {config && config.sections.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-medium">科目を選択</label>
                <div className="space-y-1">
                  <button
                    onClick={() => { setSelectedSection(null); setQuestionCount(10); }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedSection === null
                        ? "bg-blue-950/30 border border-blue-700/50 text-blue-300"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700/60"
                    }`}
                  >
                    全科目（ランダム出題）
                  </button>
                  {config.sections.map((sec, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedSection(i);
                        setQuestionCount(sec.questions ?? 10);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selectedSection === i
                          ? "bg-blue-950/30 border border-blue-700/50 text-blue-300"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700/60"
                      }`}
                    >
                      <span>{getSectionLabel(sec)}</span>
                      <span className="text-[11px] text-zinc-600">
                        {sec.questions && `${sec.questions}問`}
                        {sec.weight_pct && ` (${sec.weight_pct}%)`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question count */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-500 font-medium">練習問題数</label>
              <div className="flex gap-2">
                {[5, 10, 20, 30, 50, 100].map((n) => (
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

            {/* Exam info card */}
            {config && (
              <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4 text-sm space-y-3">
                <div className="font-medium" style={{ color: courseColor }}>
                  {config.course_name}
                </div>
                <div className="text-zinc-500 text-xs">{config.format_notes}</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-600">本番問題数:</span>{" "}
                    <span className="text-zinc-300">{config.total_questions}問</span>
                  </div>
                  <div>
                    <span className="text-zinc-600">制限時間:</span>{" "}
                    <span className="text-zinc-300">{config.duration_minutes > 0 ? `${config.duration_minutes}分` : "なし"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600">合格基準:</span>{" "}
                    <span className="text-zinc-300">{config.passing_score}%</span>
                  </div>
                </div>

                {config.sections.length > 0 && (
                  <div className="border-t border-zinc-700/40 pt-2 space-y-1">
                    <div className="text-[11px] text-zinc-600 font-medium">科目構成</div>
                    {config.sections.map((sec, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div
                          className="w-1 h-3.5 rounded-full"
                          style={{ backgroundColor: courseColor, opacity: 0.4 + (i * 0.12) }}
                        />
                        <span className="flex-1 text-zinc-400">{sec.name}</span>
                        {sec.questions && <span className="text-zinc-600 tabular-nums">{sec.questions}問</span>}
                        {sec.weight_pct && <span className="text-zinc-700 tabular-nums">{sec.weight_pct}%</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={startExam}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
            >
              {isGenerating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner" />
                  AI が {questionCount} 問を生成中...
                </span>
              ) : (
                <>
                  <Play size={14} />
                  模擬試験を開始（{questionCount}問）
                </>
              )}
            </button>
          </div>
        )}

        {/* Running Phase */}
        {phase === "running" && questions.length > 0 && (
          <div className="space-y-4">
            <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-sm border border-zinc-800/60 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                  style={{ backgroundColor: courseColor }}
                >
                  {selectedCourse}
                </span>
                <span className="text-sm text-zinc-500 tabular-nums">
                  {currentQ + 1} / {questions.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-lg font-mono font-bold tabular-nums">
                <Clock size={16} className="text-zinc-600" />
                {formatTime(timeLeft)}
              </div>
              <button
                onClick={submitExam}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Send size={12} />
                提出
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                    i === currentQ
                      ? "bg-blue-600 text-white"
                      : answers[i] !== null
                        ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/30"
                        : "bg-zinc-800 text-zinc-600 border border-zinc-700/40"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6 space-y-4">
              <p className="text-[15px] leading-relaxed text-zinc-200">{questions[currentQ].stem}</p>
              <div className="space-y-2">
                {questions[currentQ].choices.map((choice, ci) => {
                  const letter = String.fromCharCode(65 + ci);
                  const isSelected = answers[currentQ] === ci;
                  return (
                    <button
                      key={ci}
                      onClick={() => selectAnswer(currentQ, ci)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        isSelected
                          ? "bg-blue-950/30 border-blue-500/60"
                          : "bg-zinc-800/40 hover:bg-zinc-800/70 border-zinc-700/60"
                      }`}
                    >
                      <span className="font-medium text-zinc-400 mr-2">{letter}.</span>
                      <span className="text-zinc-200">{choice.text}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                  disabled={currentQ === 0}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={14} />
                  前の問題
                </button>
                <button
                  onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
                  disabled={currentQ === questions.length - 1}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm disabled:opacity-30 transition-colors"
                >
                  次の問題
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Phase */}
        {phase === "result" && (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8 text-center space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">試験結果</h2>
              <div className={`text-5xl font-bold tabular-nums ${passed ? "text-emerald-400" : "text-red-400"}`}>
                {Math.round(scorePercent)}%
              </div>
              <div className="text-lg text-zinc-300 tabular-nums">{correctCount} / {questions.length} 正解</div>
              <div
                className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
                  passed
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
                    : "bg-red-950/40 text-red-400 border border-red-800/30"
                }`}
              >
                {passed ? "合格" : "不合格"}（合格基準: {config?.passing_score}%）
              </div>
              {isSaved && <div className="text-xs text-zinc-600">結果を保存しました</div>}
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-200">問題別レビュー</h3>
              {questions.map((q, i) => {
                const ans = answers[i];
                const isCorrect = ans !== null && q.choices[ans]?.is_correct;
                return (
                  <div
                    key={i}
                    className={`bg-zinc-900/50 rounded-xl border p-4 space-y-2 ${
                      isCorrect ? "border-emerald-800/40" : "border-red-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-medium ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                        Q{i + 1}
                      </span>
                      <span className={`text-xs ${isCorrect ? "text-emerald-400/70" : "text-red-400/70"}`}>
                        {isCorrect ? "正解" : "不正解"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{q.stem}</p>
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-2.5">
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
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm transition-colors"
            >
              <RotateCcw size={14} />
              新しい模擬試験
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
