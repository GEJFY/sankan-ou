# API リファレンス

Base URL: `/api/v1/`

全エンドポイントは JSON リクエスト/レスポンス。AI Tutor 系のみ SSE ストリーミング。

> 対話型ドキュメント: `{BASE_URL}/docs` (Swagger UI)

## 認証

現在は MVP のため Demo User ID (`00000000-0000-0000-0000-000000000001`) を使用。
Phase 3 で JWT 認証に移行予定。

---

## ヘルスチェック

### GET `/health`

```json
// Response 200
{
  "status": "ok",
  "service": "grc-triple-crown-api",
  "version": "0.1.0",
  "dependencies": { "database": "ok" }
}
```

---

## Auth

### POST `/auth/register`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | メールアドレス |
| password | string | Yes | パスワード |
| display_name | string | Yes | 表示名 |

### POST `/auth/login`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | メールアドレス |
| password | string | Yes | パスワード |

Response: `{ "access_token": "...", "token_type": "bearer" }`

---

## Courses

### GET `/courses`

全アクティブコース一覧を返す。

```json
// Response 200
{
  "courses": [
    {
      "id": "uuid",
      "code": "CIA",
      "name": "Certified Internal Auditor",
      "color": "#e94560",
      "exam_config": { "total_parts": 3, "passing_score": 600 }
    }
  ]
}
```

### GET `/courses/{course_id}`

コース詳細（トピック階層含む）を返す。

---

## Cards & Review (FSRS)

### GET `/cards/due`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| course_id | UUID | - | コース ID |
| limit | int | 25 | 取得件数 (max 100) |

FSRS アルゴリズムに基づき、復習が必要なカードを返す。

### POST `/cards/review`

```json
// Request
{
  "card_id": "uuid",
  "rating": 3,           // 1=Again, 2=Hard, 3=Good, 4=Easy
  "response_time_ms": 5200
}

// Response 200
{
  "card_review_id": "uuid",
  "new_state": 2,        // 0=New, 1=Learning, 2=Review, 3=Relearning
  "new_difficulty": 5.123456,
  "new_stability": 12.345678,
  "next_review_in_hours": 48.5,
  "xp_earned": 10
}
```

---

## Dashboard

### GET `/dashboard/summary`

3資格の学習進捗サマリー（カード数、正答率、復習済み数）。

### GET `/dashboard/weak-topics`

マスタリースコアが低い上位5トピック。

### GET `/dashboard/history`

過去14日間の日別学習履歴（レビュー数、正答数）。

---

## Enrollments

### GET `/enrollments`

ユーザーの登録済みコース一覧。

### POST `/enrollments`

```json
{ "course_id": "uuid", "desired_retention": 0.9 }
```

### PUT `/enrollments/{enrollment_id}/retention`

```json
{ "desired_retention": 0.85 }  // 0.7 ~ 0.99
```

### DELETE `/enrollments/{enrollment_id}`

ソフトデリート（`is_active = false`）。

---

## Gamification

### GET `/gamification/profile`

```json
{
  "total_xp": 1250,
  "level": 5,
  "cia_xp": 500,
  "cisa_xp": 400,
  "cfe_xp": 350,
  "badges_count": 3
}
```

### GET `/gamification/missions`

今日のデイリーミッション一覧（目標・進捗・XP報酬）。

### GET `/gamification/badges`

獲得済みバッジ一覧。

### GET `/gamification/leaderboard`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| limit | int | 10 | 取得件数 (max 50) |

### POST `/gamification/xp/award`

```json
{ "amount": 50, "source": "manual_test" }
```

### GET `/gamification/xp/history`

XP 獲得履歴（ソース別）。

---

## Questions (AI 生成)

### POST `/questions/generate`

```json
// Request
{
  "topic_id": "uuid",
  "count": 5,        // 生成問題数
  "difficulty": 3     // 1-5
}

// Response - LLM が問題を生成
{
  "questions": [
    {
      "id": "uuid",
      "stem": "問題文...",
      "choices": [
        { "text": "選択肢A", "is_correct": false },
        { "text": "選択肢B", "is_correct": true }
      ],
      "explanation": "解説..."
    }
  ]
}
```

### POST `/questions/answer`

```json
// Request
{ "question_id": "uuid", "selected_index": 1, "response_time_ms": 8000 }

// Response
{ "is_correct": true, "correct_index": 1, "explanation": "..." }
```

---

## Sessions & Predictions

### POST `/sessions/start`

```json
{ "course_id": "uuid", "session_type": "review" }
// session_type: review | quiz | tutor | synergy
```

### POST `/sessions/end`

```json
{
  "session_id": "uuid",
  "cards_reviewed": 25,
  "cards_correct": 20
}
```

### GET `/sessions/today`

今日の学習統計 + 連続学習日数（ストリーク）。

### GET `/predictions/{course_id}`

合格確率予測（マスタリースコアベース）。

### GET `/predictions/{course_id}/roi`

学習 ROI 推定（弱点トピック優先度付き）。

### GET `/mastery/{course_id}`

トピック別マスタリースコア一覧。

---

## Synergy (シナジー学習)

### GET `/synergy/areas`

全シナジーエリア（CIA/CISA/CFE 横断知識）一覧。

### GET `/synergy/overview`

3資格間の重複率（約40%）と主要シナジーエリア。

### GET `/synergy/study`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| area | string | - | シナジーエリア名 |
| limit | int | 10 | 取得件数 (max 50) |

### GET `/synergy/course/{course_code}`

特定コースのプラグイン情報・シラバス・シナジーエリア。

---

## Mock Exam (模擬試験)

### GET `/mock-exam/config/{course_code}`

試験設定（制限時間、合格点、セクション構成）。

```json
{
  "course_code": "CIA",
  "duration_minutes": 150,
  "passing_score": 600,
  "sections": [
    { "name": "Part 1", "question_count": 125 }
  ]
}
```

### POST `/mock-exam/start`

```json
{
  "course_code": "CIA",
  "section": "Part 1",
  "question_count": 20     // 短縮版
}
```

LLM が本番形式の問題を生成して返す。

---

## AI Tutor (SSE ストリーミング)

全エンドポイントが `text/event-stream` で応答。

### SSE フォーマット

```
data: {"text": "チャンクテキスト"}

data: {"text": "次のチャンク"}

data: {"error": "エラー時のメッセージ"}

data: [DONE]
```

### POST `/ai-tutor/explain`

```json
{
  "concept": "内部統制",
  "level": 4,                    // 1-6 (説明レベル)
  "course_codes": ["CIA", "CISA"] // オプション
}
```

概念の詳細解説をストリーミング。

### POST `/ai-tutor/compare`

```json
{ "concept": "リスクマネジメント" }
```

CIA/CISA/CFE 3資格での比較表を生成。

### POST `/ai-tutor/chat`

```json
{ "message": "CIAとCISAの違いは？", "level": 3 }
```

一般的な Q&A チャット。

### POST `/ai-tutor/socratic`

```json
{
  "concept": "COSO フレームワーク",
  "user_answer": "5つの構成要素がある",
  "is_correct": true
}
```

ソクラテス式対話で理解を深める。

### POST `/ai-tutor/bridge`

```json
{
  "concept": "内部統制",
  "from_course": "CIA",
  "to_course": "CISA"
}
```

資格間の知識マッピング（ブリッジ学習）。

---

## Media (AI コンテンツ生成)

### POST `/media/slides/generate`

```json
{
  "topic": "COSO フレームワーク",
  "course_code": "CIA",
  "slide_count": 5,     // 3-10
  "level": 4            // 1-6
}
```

### POST `/media/audio/script`

```json
{
  "topic": "IT ガバナンス",
  "course_code": "CISA",
  "duration_minutes": 5,  // 1-15
  "level": 3
}
```

### GET `/media/capabilities`

利用可能なメディア機能のステータス。
