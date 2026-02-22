"use client";

import { useCallback, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/constants";
import LevelSelector from "./level-selector";
import { Send } from "lucide-react";

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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState(4);
  const [mode, setMode] = useState<TutorMode>("chat");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2 mb-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">AI Tutor</h1>
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

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 border border-zinc-700/40 text-zinc-300"
              }`}
            >
              {msg.content}
              {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="animate-pulse ml-1 text-blue-400">|</span>
              )}
            </div>
          </div>
        ))}
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
