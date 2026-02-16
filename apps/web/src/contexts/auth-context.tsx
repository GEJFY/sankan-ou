"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { API_BASE_URL } from "@/lib/constants";
import type { User, TokenResponse } from "@/types";

const TOKEN_KEY = "sankanou_token";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // トークン検証 + ユーザー情報取得
  const fetchMe = useCallback(async (accessToken: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      return (await res.json()) as User;
    } catch {
      return null;
    }
  }, []);

  // 初期化: localStorageからトークン復元
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }
    fetchMe(saved).then((u) => {
      if (u) {
        setToken(saved);
        setUser(u);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      setLoading(false);
    });
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "ログインに失敗しました" }));
      throw new Error(err.detail || "ログインに失敗しました");
    }
    const data = (await res.json()) as TokenResponse;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);

    const u = await fetchMe(data.access_token);
    if (u) setUser(u);
  }, [fetchMe]);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "登録に失敗しました" }));
      throw new Error(err.detail || "登録に失敗しました");
    }
    // 登録後に自動ログイン
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
