import { API_BASE_URL, TOKEN_STORAGE_KEY } from "./constants";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/** Typed fetch wrapper for API calls (Bearer token auto-injection) */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}/api/v1${path}`;
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // 401 → トークン無効、ログインページへ
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("認証が必要です");
  }

  if (!res.ok) {
    // FastAPIの標準エラー形式 {"detail": "..."} からメッセージを取り出す。
    // JSON以外のレスポンスや detail が無い場合は汎用メッセージにフォールバックし、
    // 生のレスポンス本文をそのままユーザーに見せない。
    let message = `リクエストに失敗しました（エラーコード: ${res.status}）`;
    try {
      const body = await res.json();
      if (body && typeof body.detail === "string" && body.detail.trim()) {
        message = body.detail;
      } else if (body && Array.isArray(body.detail) && body.detail.length > 0) {
        // Pydanticのバリデーションエラー形式（detail が配列）
        const first = body.detail[0];
        if (first && typeof first.msg === "string") {
          message = first.msg;
        }
      }
    } catch {
      // JSONとして解析できない場合は汎用メッセージのまま
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
