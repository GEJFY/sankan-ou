"""受験者の職業バックグラウンドに応じた最短学習ルート推定

会計士やITエンジニア/AIエンジニアなど、実務知識がある受験者は一部トピックの
基礎を素地として持っている可能性が高い。ただし出題は各資格団体(IIA/ISACA/ACFE)
固有の基準・手続に基づくため、「学習を丸ごと省略してよい」わけではなく、
「軽い確認で済ませ、残りに時間を集中させる」ことが最短合格のポイントになる。
"""

BACKGROUND_LABELS: dict[str, str] = {
    "accountant": "会計士・経理実務家",
    "it_engineer": "ITエンジニア・AIエンジニア",
}

# 各背景を持つ受験者が実務経験から基礎を掴んでいる可能性が高いトピック
# (キーワードが Topic.name に部分一致すれば「素地あり」と判定する)
_BACKGROUND_TOPIC_KEYWORDS: dict[str, dict[str, list[str]]] = {
    "accountant": {
        # 2025年GIAS改訂後のCIAには独立した「財務管理」トピックがなく、素地として
        # 明確に流用できる領域はない (Part3は監査部門運営の内部プロセスが中心)
        "CIA": [],
        "CISA": [],
        "CFE": ["財務諸表不正"],
        "USCPA": ["財務会計", "管理会計"],
    },
    "it_engineer": {
        # 2025年GIAS改訂後のCIAにも独立したITトピックはない
        # (IT/サイバーリスクはPart1「ガバナンス・リスク・コントロール」に統合済み)
        "CIA": [],
        "CISA": ["IS取得・開発・実装", "IS運用とビジネスレジリエンス", "情報資産の保護"],
        "CFE": ["デジタルフォレンジックとデータ分析"],
        "USCPA": [],
    },
}


def resolve_backgrounds(raw: str | None) -> list[str]:
    """クエリパラメータ (カンマ区切り) から有効な背景キーのみ抽出"""
    if not raw:
        return []
    keys = [k.strip() for k in raw.split(",") if k.strip()]
    return [k for k in keys if k in BACKGROUND_LABELS]


def classify_topics(
    course_code: str, topic_names: list[str], backgrounds: list[str]
) -> tuple[list[str], list[str]]:
    """トピック名一覧を (素地ありトピック, 要注力トピック) に分類する"""
    strong_keywords: set[str] = set()
    for bg in backgrounds:
        strong_keywords.update(
            _BACKGROUND_TOPIC_KEYWORDS.get(bg, {}).get(course_code.upper(), [])
        )

    strong: list[str] = []
    focus: list[str] = []
    for name in topic_names:
        if any(kw in name for kw in strong_keywords):
            strong.append(name)
        else:
            focus.append(name)
    return strong, focus


def build_fast_track_note(
    course_code: str,
    backgrounds: list[str],
    strong: list[str],
    focus: list[str],
    total_topics: int,
) -> str | None:
    """背景を踏まえた最短合格ルートの一言アドバイスを生成する"""
    if not backgrounds:
        return None

    labels = "・".join(BACKGROUND_LABELS[b] for b in backgrounds)

    if not strong:
        return (
            f"{labels}の背景でも、{course_code}は既習分野との重なりが小さいため、"
            "全トピックをまんべんなく学習するのが最短ルートです。"
        )

    strong_str = "、".join(strong)
    focus_str = "、".join(focus) if focus else "なし"
    return (
        f"{labels}の背景なら「{strong_str}」は実務の素地があるため、"
        "フラッシュカードと問題演習での確認に留めて時間を節約し、"
        f"残り{len(focus)}/{total_topics}トピック（{focus_str}）に学習時間を集中させるのが最短合格ルートです。"
        f"※出題は{course_code}固有の基準・手続に基づくため、素地がある分野も模試で最終確認は必須です。"
    )
