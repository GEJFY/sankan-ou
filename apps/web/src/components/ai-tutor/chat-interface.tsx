"use client";

import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_BASE_URL } from "@/lib/constants";
import LevelSelector from "./level-selector";
import { Send, Volume2, VolumeX, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type TutorMode = "chat" | "explain" | "compare" | "socratic" | "bridge";

const MODES: { value: TutorMode; label: string; desc: string; detail: string }[] = [
  { value: "chat", label: "Q&A", desc: "自由に質問", detail: "GRC分野の疑問に何でも回答します" },
  { value: "explain", label: "解説", desc: "レベル別解説", detail: "初心者〜専門家まで6段階のレベルで概念を解説" },
  { value: "compare", label: "比較", desc: "3資格比較表", detail: "CIA/CISA/CFEでの概念の違いを比較表で整理" },
  { value: "socratic", label: "ソクラテス式", desc: "対話で理解深化", detail: "問答形式で考えを深め、理解を確認" },
  { value: "bridge", label: "ブリッジ", desc: "資格間の橋渡し", detail: "ある資格の知識を別の資格に応用する方法を解説" },
];

/**
 * アシスタントメッセージからフォローアップ質問を抽出する。
 * "関連する質問:" または "**関連する質問:**" ヘッダーの後にある
 * 番号付きリスト項目を取得する。
 */
function parseFollowUpQuestions(content: string): string[] {
  const questions: string[] = [];
  // 「関連する質問」セクション以降の番号付き行を抽出
  const sectionMatch = content.match(/\*{0,2}関連する質問[:：]\*{0,2}\s*\n([\s\S]*?)$/);
  if (sectionMatch) {
    const lines = sectionMatch[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*\d+[.．)\)]\s*(.+)/);
      if (match) {
        questions.push(match[1].trim());
      }
    }
  }
  return questions;
}

/**
 * メッセージ本文からフォローアップ質問セクションを除去して返す。
 */
function stripFollowUpSection(content: string): string {
  return content.replace(/\n*\*{0,2}関連する質問[:：]\*{0,2}\s*\n[\s\S]*?$/, "").trimEnd();
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState(4);
  const [mode, setMode] = useState<TutorMode>("chat");
  const [isStreaming, setIsStreaming] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  /** TTS: アシスタントメッセージを日本語で読み上げ */
  const speakMessage = useCallback((text: string, messageIndex: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // 読み上げ中なら停止
    if (speakingIndex === messageIndex) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    // 他のメッセージを読み上げ中なら先に停止
    window.speechSynthesis.cancel();

    // Markdownの記号を除去してプレーンテキストにする
    const plainText = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[|─\-]{3,}/g, "")
      .replace(/^\s*[-*+]\s/gm, "")
      .replace(/^\s*\d+[.．]\s/gm, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "ja-JP";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // 日本語の音声を優先選択
    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(messageIndex);
    window.speechSynthesis.speak(utterance);
  }, [speakingIndex]);

  /** 会話をクリア */
  const clearChat = useCallback(() => {
    if (isStreaming) return;
    window.speechSynthesis?.cancel();
    setSpeakingIndex(null);
    setMessages([]);
  }, [isStreaming]);

  const sendMessage = useCallback(
    async (message: string, overrideEndpoint?: string) => {
      if (!message.trim() || isStreaming) return;

      const endpoint = overrideEndpoint || `/ai-tutor/${mode}`;
      const userMsg: Message = { role: "user", content: message };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);

      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      const bodyMap: Record<string, object> = {
        chat: { message, level },
        explain: { concept: message, level },
        compare: { concept: message },
        socratic: { concept: message, user_answer: message, is_correct: false },
        bridge: { concept: message, from_course: "CIA", to_course: "CISA" },
      };

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("sankanou_token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
          method: "POST",
          headers,
          body: JSON.stringify(bodyMap[mode] || { message, concept: message, level }),
        });

        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No reader available");

        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  accumulated += `[エラー] ${parsed.error}`;
                } else {
                  accumulated += parsed.text || "";
                }
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                  };
                  return updated;
                });
                scrollToBottom();
              } catch {
                // skip invalid JSON lines
              }
            }
          }
        }
      } catch (e) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: `エラー: ${e instanceof Error ? e.message : "通信エラーが発生しました"}`,
          };
          return updated;
        });
      }

      setIsStreaming(false);
    },
    [level, isStreaming, mode]
  );

  /** フォローアップ質問をクリックしたときの処理 */
  const handleFollowUp = useCallback(
    (question: string) => {
      sendMessage(question);
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">AI Tutor</h1>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              disabled={isStreaming}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50 transition-colors"
              title="会話をクリアして新しく始める"
            >
              <Trash2 size={12} />
              新しい会話
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-500">5つのモードで質問・解説・比較・ソクラテス式対話・資格間ブリッジ学習</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors font-medium ${
              mode === m.value
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-400"
            }`}
            title={m.detail}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Level selector */}
      <LevelSelector level={level} onChange={setLevel} />

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 py-4 px-2"
      >
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-16 space-y-4">
            <p className="text-lg font-medium text-zinc-400">
              モード: <span className="text-blue-400">{MODES.find(m => m.value === mode)?.label}</span>
              {" — "}
              <span className="text-zinc-500">{MODES.find(m => m.value === mode)?.desc}</span>
            </p>
            <p className="text-xs text-zinc-600">{MODES.find(m => m.value === mode)?.detail}</p>
            <div className="flex gap-2 justify-center flex-wrap mt-6">
              <button
                onClick={() => { setMode("explain"); sendMessage("内部統制とは何か？"); }}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
              >
                「内部統制」を解説
              </button>
              <button
                onClick={() => { setMode("compare"); sendMessage("リスクマネジメント"); }}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
              >
                3資格で「リスク管理」を比較
              </button>
              <button
                onClick={() => { setMode("bridge"); sendMessage("COSOフレームワーク"); }}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
              >
                COSO: CIA→CISAブリッジ
              </button>
              <button
                onClick={() => { setMode("socratic"); sendMessage("内部監査の独立性とは組織から独立して監査すること"); }}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
              >
                ソクラテス式対話
              </button>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isAssistant = msg.role === "assistant";
          const isCurrentlyStreaming = isStreaming && i === messages.length - 1 && isAssistant;
          const followUps = isAssistant && !isCurrentlyStreaming
            ? parseFollowUpQuestions(msg.content)
            : [];
          const displayContent = isAssistant && followUps.length > 0
            ? stripFollowUpSection(msg.content)
            : msg.content;

          return (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white whitespace-pre-wrap"
                      : "bg-zinc-800 border border-zinc-700/40 text-zinc-300"
                  }`}
                >
                  {isAssistant ? (
                    <>
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {displayContent}
                        </ReactMarkdown>
                      </div>
                      {isCurrentlyStreaming && (
                        <span className="animate-pulse ml-1 text-blue-400">|</span>
                      )}
                    </>
                  ) : (
                    <>
                      {msg.content}
                    </>
                  )}
                </div>

                {/* TTS button for assistant messages (shown when not streaming) */}
                {isAssistant && !isCurrentlyStreaming && msg.content && (
                  <div className="flex items-center gap-2 pl-1">
                    <button
                      onClick={() => speakMessage(msg.content, i)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 rounded-md hover:bg-zinc-800 transition-colors"
                      title={speakingIndex === i ? "読み上げを停止" : "日本語で読み上げ"}
                    >
                      {speakingIndex === i ? (
                        <VolumeX size={14} className="text-blue-400" />
                      ) : (
                        <Volume2 size={14} />
                      )}
                      <span>{speakingIndex === i ? "停止" : "読み上げ"}</span>
                    </button>
                  </div>
                )}

                {/* Follow-up question buttons */}
                {followUps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                    {followUps.map((q, qi) => (
                      <button
                        key={qi}
                        onClick={() => handleFollowUp(q)}
                        disabled={isStreaming}
                        className="px-3 py-1.5 text-xs text-blue-400 bg-blue-950/30 border border-blue-800/40 rounded-lg hover:bg-blue-900/40 hover:border-blue-700/50 hover:text-blue-300 disabled:opacity-50 transition-colors text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800/60 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="質問を入力..."
            disabled={isStreaming}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/60 disabled:opacity-50 transition-colors placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
          >
            <Send size={14} />
            送信
          </button>
        </form>
      </div>
    </div>
  );
}
