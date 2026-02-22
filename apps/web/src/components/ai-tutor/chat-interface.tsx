"use client";

import { useCallback, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/constants";
import LevelSelector from "./level-selector";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type TutorMode = "chat" | "explain" | "compare" | "socratic" | "bridge";

const MODES: { value: TutorMode; label: string; desc: string }[] = [
  { value: "chat", label: "Q&A", desc: "自由に質問" },
  { value: "explain", label: "解説", desc: "レベル別解説" },
  { value: "compare", label: "比較", desc: "3資格比較表" },
  { value: "socratic", label: "ソクラテス式", desc: "対話で理解深化" },
  { value: "bridge", label: "ブリッジ", desc: "資格間の橋渡し" },
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

      // SSE streaming
      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      // モード別リクエストボディ構築
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
      {/* Mode selector */}
      <div className="flex gap-1 mb-2 overflow-x-auto">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              mode === m.value
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            title={m.desc}
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
          <div className="text-center text-gray-500 mt-20 space-y-4">
            <p className="text-2xl">AI Tutor</p>
            <p className="text-sm">
              モード: <span className="text-blue-400 font-semibold">{MODES.find(m => m.value === mode)?.label}</span>
              {" - "}
              {MODES.find(m => m.value === mode)?.desc}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => { setMode("explain"); sendMessage("内部統制とは何か？"); }}
                className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700"
              >
                「内部統制」を解説
              </button>
              <button
                onClick={() => { setMode("compare"); sendMessage("リスクマネジメント"); }}
                className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700"
              >
                3資格で「リスク管理」を比較
              </button>
              <button
                onClick={() => { setMode("bridge"); sendMessage("COSOフレームワーク"); }}
                className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700"
              >
                COSO: CIA→CISAブリッジ
              </button>
              <button
                onClick={() => { setMode("socratic"); sendMessage("内部監査の独立性とは組織から独立して監査すること"); }}
                className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-gray-300 hover:bg-gray-700"
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
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              {msg.content}
              {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="animate-pulse ml-1">|</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 pt-4">
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
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
}
