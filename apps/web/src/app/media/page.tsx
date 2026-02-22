"use client";

import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import { apiFetch } from "@/lib/api-client";
import { ChevronLeft, ChevronRight, Download, Sparkles } from "lucide-react";

interface Slide {
  slide_number: number;
  title: string;
  content: string[];
  notes?: string;
  visual?: string;
  image_base64?: string;
  image_mime_type?: string;
}

interface AudioSection {
  title: string;
  script: string;
  check_question?: string;
}

interface Topic {
  id: string;
  name: string;
}

type MediaMode = "slides" | "audio";

const COURSES = [
  { code: "CIA", color: "#e94560" },
  { code: "CISA", color: "#0891b2" },
  { code: "CFE", color: "#7c3aed" },
];

const SLIDE_COUNT_OPTIONS = [5, 8, 10, 15] as const;

export default function MediaPage() {
  const [mode, setMode] = useState<MediaMode>("slides");
  const [courseCode, setCourseCode] = useState("CIA");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [slideCount, setSlideCount] = useState<number>(5);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [audioSections, setAudioSections] = useState<AudioSection[]>([]);
  const [audioTitle, setAudioTitle] = useState("");

  useEffect(() => {
    apiFetch<{ courses: { id: string; code: string }[] }>("/courses")
      .then((data) => {
        const course = data.courses.find((c) => c.code === courseCode);
        if (course) {
          return apiFetch<{ topics: Topic[] }>(`/courses/${course.id}/topics`);
        }
        return null;
      })
      .then((data) => {
        if (data) {
          // カテゴリ名で重複を除去
          const unique = Array.from(
            new Map(data.topics.map((t) => [t.name, t])).values()
          );
          setTopics(unique);
          if (unique.length > 0) setSelectedTopic(unique[0].name);
        }
      })
      .catch(() => setTopics([]));
  }, [courseCode]);

  const getTopicText = () => {
    const base = selectedTopic || "一般的なトピック";
    return additionalPrompt ? `${base} - ${additionalPrompt}` : base;
  };

  const generateSlides = async () => {
    if (!selectedTopic) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await apiFetch<{ slides: Slide[] }>("/media/slides/generate", {
        method: "POST",
        body: JSON.stringify({
          topic: getTopicText(),
          course_code: courseCode,
          slide_count: slideCount,
        }),
      });
      setSlides(data.slides);
      setCurrentSlide(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "スライド生成に失敗しました");
    }
    setIsGenerating(false);
  };

  const generateAudioScript = async () => {
    if (!selectedTopic) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await apiFetch<{
        title: string;
        sections: AudioSection[];
      }>("/media/audio/script", {
        method: "POST",
        body: JSON.stringify({
          topic: getTopicText(),
          course_code: courseCode,
          duration_minutes: 5,
        }),
      });
      setAudioTitle(data.title);
      setAudioSections(data.sections);
    } catch (e) {
      setError(e instanceof Error ? e.message : "スクリプト生成に失敗しました");
    }
    setIsGenerating(false);
  };

  const downloadSlides = useCallback(() => {
    if (slides.length === 0) return;
    const exportData = {
      course_code: courseCode,
      topic: selectedTopic,
      generated_at: new Date().toISOString(),
      slide_count: slides.length,
      slides: slides.map(({ image_base64, image_mime_type, ...rest }) => rest),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `slides_${courseCode}_${selectedTopic.replace(/\s+/g, "_")}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [slides, courseCode, selectedTopic]);

  const courseColor = COURSES.find((c) => c.code === courseCode)?.color || "#666";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="スライド / 音声学習"
          description="AIが学習コンテンツを自動生成"
          tooltip="カテゴリ（科目）を選択してスライドや音声スクリプトを生成します。追加プロンプトで内容を詳細にカスタマイズすることもできます。"
        />

        {error && (
          <div className="bg-red-950/40 border border-red-900/60 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Settings panel */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("slides")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "slides"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600"
              }`}
            >
              スライド生成
            </button>
            <button
              onClick={() => setMode("audio")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "audio"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600"
              }`}
            >
              音声スクリプト
            </button>
          </div>

          {/* Course selection */}
          <div className="flex gap-2">
            {COURSES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCourseCode(c.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  courseCode === c.code ? "text-white" : "text-zinc-500 bg-zinc-800 border border-zinc-700"
                }`}
                style={courseCode === c.code ? { backgroundColor: c.color } : {}}
              >
                {c.code}
              </button>
            ))}
          </div>

          {/* Topic category selection */}
          {topics.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">カテゴリ（科目）を選択</p>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.name}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Slide count selector (slides mode only) */}
          {mode === "slides" && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">スライド枚数</p>
              <div className="flex gap-2">
                {SLIDE_COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setSlideCount(count)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      slideCount === count
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    {count}枚
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Additional prompt */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">
              追加プロンプト（任意）
              <span className="text-zinc-600 ml-1">-- 内容を詳細に指定</span>
            </p>
            <div className="flex gap-2">
              <input
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="例: 5つの構成要素を図解で詳しく"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 transition-colors placeholder:text-zinc-600"
              />
              <button
                onClick={mode === "slides" ? generateSlides : generateAudioScript}
                disabled={isGenerating || !selectedTopic}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
              >
                <Sparkles size={14} />
                {isGenerating ? "生成中..." : "生成"}
              </button>
            </div>
          </div>
        </div>

        {/* Progress indicator during generation */}
        {isGenerating && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="spinner spinner-lg" />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-zinc-200">
                  {mode === "slides"
                    ? `AIがスライドを生成中... (${slideCount}枚)`
                    : "AIが音声スクリプトを生成中..."}
                </p>
                <p className="text-xs text-zinc-500">
                  約10-20秒かかります。しばらくお待ちください。
                </p>
              </div>
              {/* Animated progress bar */}
              <div className="w-full max-w-xs bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    animation: "progressIndeterminate 2s ease-in-out infinite",
                    width: "40%",
                  }}
                />
              </div>
            </div>
            <style jsx>{`
              @keyframes progressIndeterminate {
                0% {
                  transform: translateX(-100%);
                }
                50% {
                  transform: translateX(150%);
                }
                100% {
                  transform: translateX(-100%);
                }
              }
            `}</style>
          </div>
        )}

        {/* Slides display */}
        {mode === "slides" && slides.length > 0 && !isGenerating && (
          <div className="space-y-4">
            {/* Slide header with download button */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-400">
                生成結果 ({slides.length}枚)
              </h3>
              <button
                onClick={downloadSlides}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
              >
                <Download size={12} />
                ダウンロード (JSON)
              </button>
            </div>

            <div
              className="bg-zinc-900/50 rounded-2xl border p-8 min-h-90 flex flex-col justify-between"
              style={{ borderColor: `${courseColor}40` }}
            >
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span
                    className="px-2.5 py-1 rounded text-[11px] font-semibold text-white tracking-wide"
                    style={{ backgroundColor: courseColor }}
                  >
                    {courseCode}
                  </span>
                  <span className="text-sm text-zinc-500 tabular-nums font-medium">
                    {currentSlide + 1} / {slides.length}
                  </span>
                </div>

                {slides[currentSlide]?.image_base64 ? (
                  <div className="space-y-4">
                    <img
                      src={`data:${slides[currentSlide].image_mime_type || "image/png"};base64,${slides[currentSlide].image_base64}`}
                      alt={slides[currentSlide]?.title || "スライド"}
                      className="w-full rounded-xl"
                    />
                    <h2 className="text-lg font-bold text-zinc-100 leading-snug">
                      {slides[currentSlide]?.title}
                    </h2>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-zinc-50 mb-5 leading-tight">
                      {slides[currentSlide]?.title}
                    </h2>
                    <ul className="space-y-3">
                      {slides[currentSlide]?.content?.map((item, i) => (
                        <li key={i} className="flex gap-3 text-sm text-zinc-300 leading-relaxed">
                          <span
                            className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: courseColor }}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {slides[currentSlide]?.notes && (
                <div className="mt-6 text-xs text-zinc-400 bg-zinc-800/50 border border-zinc-700/40 rounded-lg p-3 leading-relaxed">
                  <span className="text-zinc-500 font-medium">Notes: </span>
                  {slides[currentSlide].notes}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="inline-flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
                前のスライド
              </button>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === currentSlide ? "bg-blue-500" : "bg-zinc-700 hover:bg-zinc-600"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                disabled={currentSlide === slides.length - 1}
                className="inline-flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm disabled:opacity-30 transition-colors"
              >
                次のスライド
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Audio script display */}
        {mode === "audio" && audioSections.length > 0 && !isGenerating && (
          <div className="space-y-4">
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/60 p-6">
              <h2 className="text-base font-semibold text-zinc-200 mb-4">{audioTitle}</h2>
              <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3 text-xs text-amber-400/80 mb-4">
                TTS音声再生は将来バージョンで実装予定です。現在はスクリプトのテキスト表示のみです。
              </div>
              <div className="space-y-5">
                {audioSections.map((section, i) => (
                  <div key={i} className="space-y-2">
                    <h3 className="text-sm font-medium" style={{ color: courseColor }}>
                      Section {i + 1}: {section.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                      {section.script}
                    </p>
                    {section.check_question && (
                      <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-3 text-xs text-blue-400/80">
                        理解度チェック: {section.check_question}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
