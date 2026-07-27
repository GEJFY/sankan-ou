"""シンプルなインメモリ・スライディングウィンドウ・レート制限

単一プロセス/単一コンテナ運用を前提とした軽量実装。
複数レプリカ運用に拡張する場合はRedisベースの実装に置き換えること。
"""

import time
import uuid
from collections import defaultdict, deque
from collections.abc import Awaitable, Callable

from fastapi import HTTPException, Request, status


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: float) -> None:
        now = time.monotonic()
        hits = self._hits[key]
        cutoff = now - window_seconds
        while hits and hits[0] < cutoff:
            hits.popleft()
        if len(hits) >= limit:
            retry_after = max(1, int(window_seconds - (now - hits[0])))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="リクエストが多すぎます。しばらくしてから再試行してください。",
                headers={"Retry-After": str(retry_after)},
            )
        hits.append(now)


limiter = SlidingWindowLimiter()


def rate_limit_by_ip(
    bucket: str, limit: int, window_seconds: float = 60.0
) -> Callable[[Request], Awaitable[None]]:
    """FastAPI dependency factory: 未認証エンドポイント向け、`bucket` + クライアントIPで制限"""

    async def _dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        limiter.check(f"{bucket}:{client_ip}", limit, window_seconds)

    return _dependency


def check_user_rate_limit(
    bucket: str, user_id: uuid.UUID | str, limit: int, window_seconds: float = 60.0
) -> None:
    """認証済みエンドポイント向け: ルートハンドラ内でcurrent_user.id取得後に呼び出す"""
    limiter.check(f"{bucket}:{user_id}", limit, window_seconds)
