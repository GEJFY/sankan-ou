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
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tight">GRC</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Triple Crown
            </h1>
          </div>
          <p className="text-zinc-500 text-sm">CIA / CISA / CFE 3資格同時学習</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8 space-y-5"
        >
          <h2 className="text-lg font-semibold text-zinc-200 mb-1">ログイン</h2>

          {error && (
            <div className="rounded-xl bg-red-950/40 border border-red-900/60 px-4 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-500 font-medium mb-1.5">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 font-medium mb-1.5">パスワード</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              placeholder="8文字以上"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            アカウントがない場合は{" "}
            <Link href="/register" className="text-blue-400 hover:underline">
              新規登録
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
