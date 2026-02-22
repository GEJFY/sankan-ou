"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import { apiFetch } from "@/lib/api-client";

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

type MediaMode = "slides" | "audio";

const COURSES = [
  { code: "CIA", color: "#e94560" },
  { code: "CISA", color: "#0891b2" },
  { code: "CFE", color: "#7c3aed" },
];

export default function MediaPage() {
  const [mode, setMode] = useState<MediaMode>("slides");
  const [topic, setTopic] = useState("");
  const [courseCode, setCourseCode] = useState("CIA");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slides state
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Audio state
  const [audioSections, setAudioSections] = useState<AudioSection[]>([]);
  const [audioTitle, setAudioTitle] = useState("");

  const generateSlides = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await apiFetch<{ slides: Slide[] }>("/media/slides/generate", {
        method: "POST",
        body: JSON.stringify({ topic, course_code: courseCode, slide_count: 5 }),
      });
      setSlides(data.slides);
      setCurrentSlide(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "スライド生成に失敗しました");
    }
    setIsGenerating(false);
  };

  const generateAudioScript = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await apiFetch<{
        title: string;
        sections: AudioSection[];
      }>("/media/audio/script", {
        method: "POST",
        body: JSON.stringify({
          topic,
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

  const courseColor = COURSES.find((c) => c.code === courseCode)?.color || "#666";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">スライド / 音声学習</h1>
          <p className="text-gray-500 mt-1">AIが学習コンテンツを自動生成</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* 設定パネル */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          {/* モード切替 */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("slides")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                mode === "slides"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              スライド生成
            </button>
            <button
              onClick={() => setMode("audio")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                mode === "audio"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              音声スクリプト
            </button>
          </div>

          {/* コース選択 */}
          <div className="flex gap-2">
            {COURSES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCourseCode(c.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  courseCode === c.code
                    ? "text-white"
                    : "text-gray-400 bg-gray-800"
                }`}
                style={
                  courseCode === c.code ? { backgroundColor: c.color } : {}
                }
              >
                {c.code}
              </button>
            ))}
          </div>

          {/* トピック入力 */}
          <div className="flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="トピックを入力（例: 内部統制の5つの構成要素）"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={mode === "slides" ? generateSlides : generateAudioScript}
              disabled={isGenerating || !topic.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {isGenerating ? "生成中..." : "生成"}
            </button>
          </div>
        </div>

        {/* スライド表示 */}
        {mode === "slides" && slides.length > 0 && (
          <div className="space-y-4">
            {/* スライド本体 */}
            <div
              className="bg-gray-900 rounded-2xl border p-8 min-h-[300px] flex flex-col justify-between"
              style={{ borderColor: courseColor }}
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: courseColor }}
                  >
                    {courseCode}
                  </span>
                  <span className="text-sm text-gray-500">
                    {currentSlide + 1} / {slides.length}
                  </span>
                </div>

                {/* Gemini生成画像がある場合 */}
                {slides[currentSlide]?.image_base64 ? (
                  <div className="space-y-4">
                    <img
                      src={`data:${slides[currentSlide].image_mime_type || "image/png"};base64,${slides[currentSlide].image_base64}`}
                      alt={slides[currentSlide]?.title || "スライド"}
                      className="w-full rounded-xl"
                    />
                    <h2 className="text-lg font-bold">
                      {slides[currentSlide]?.title}
                    </h2>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-4">
                      {slides[currentSlide]?.title}
                    </h2>
                    <ul className="space-y-2">
                      {slides[currentSlide]?.content?.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-300">
                          <span className="text-blue-400">&bull;</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {slides[currentSlide]?.notes && (
                <div className="mt-4 text-xs text-gray-500 bg-gray-800 rounded-lg p-3">
                  {slides[currentSlide].notes}
                </div>
              )}
            </div>

            {/* スライドナビ */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="px-4 py-2 bg-gray-800 rounded-lg text-sm disabled:opacity-30"
              >
                前のスライド
              </button>
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-3 h-3 rounded-full ${
                      i === currentSlide ? "bg-blue-500" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  setCurrentSlide(
                    Math.min(slides.length - 1, currentSlide + 1)
                  )
                }
                disabled={currentSlide === slides.length - 1}
                className="px-4 py-2 bg-gray-800 rounded-lg text-sm disabled:opacity-30"
              >
                次のスライド
              </button>
            </div>
          </div>
        )}

        {/* 音声スクリプト表示 */}
        {mode === "audio" && audioSections.length > 0 && (
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold mb-4">{audioTitle}</h2>
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 text-xs text-yellow-300 mb-4">
                TTS音声再生は将来バージョンで実装予定です。現在はスクリプトのテキスト表示のみです。
              </div>
              <div className="space-y-4">
                {audioSections.map((section, i) => (
                  <div key={i} className="space-y-2">
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: courseColor }}
                    >
                      Section {i + 1}: {section.title}
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {section.script}
                    </p>
                    {section.check_question && (
                      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-xs text-blue-300">
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
