"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">
            <span style={{ color: "#e94560" }}>GRC</span>{" "}
            <span className="text-white">Triple Crown</span>
          </h1>
          <p className="text-gray-400 text-sm">CIA / CISA / CFE 3資格同時学習</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-700 bg-gray-900/80 p-8 space-y-5"
        >
          <h2 className="text-xl font-bold text-white mb-1">ログイン</h2>

          {error && (
            <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-2 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-600 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">パスワード</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-600 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#e94560] transition"
              placeholder="8文字以上"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 font-bold text-white transition disabled:opacity-50"
            style={{ background: "#e94560" }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          <p className="text-center text-sm text-gray-400">
            アカウントがない場合は{" "}
            <Link href="/register" className="text-[#0891b2] hover:underline">
              新規登録
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
