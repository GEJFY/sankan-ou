# アーキテクチャ

## システム構成図

```
                            ┌─────────────────────────────────────┐
                            │         Azure Cloud                  │
                            │                                      │
┌──────────┐   HTTPS        │  ┌──────────────┐  ┌─────────────┐  │
│ Browser  │───────────────▶│  │ Container App│  │ Container   │  │
│ (Web)    │◀───────────────│  │ sankanou-web │  │ App         │  │
└──────────┘                │  │ :3000        │  │ sankanou-api│  │
                            │  └──────────────┘  │ :8000       │  │
                            │                     └──────┬──────┘  │
                            │                            │         │
                            │              ┌─────────────┼────┐    │
                            │              │             │    │    │
                            │              ▼             ▼    │    │
                            │  ┌──────────────┐  ┌──────────┐│    │
                            │  │ PostgreSQL   │  │ Azure AI ││    │
                            │  │ Flexible     │  │ Foundry  ││    │
                            │  │ Server       │  │ (GPT-5)  ││    │
                            │  │ + pgvector   │  └──────────┘│    │
                            │  └──────────────┘   East US 2  │    │
                            │     Japan East                  │    │
                            └─────────────────────────────────┘    │
                                                                   │
                            ┌──────────────────────────────────────┘
                            │  ACR: sankanouacr.azurecr.io
                            │  CI/CD: GitHub Actions
                            └──────────────────────────────────────
```

## データベーススキーマ

### ER 図 (主要エンティティ)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    users     │     │   courses    │     │   topics    │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)      │     │ id (PK)     │
│ email       │     │ code (unique)│◀────│ course_id   │
│ display_name│     │ name         │     │ parent_id   │
│ role        │     │ color        │     │ name        │
│ is_active   │     │ exam_config  │     │ weight_pct  │
└──────┬──────┘     └──────┬───────┘     │ level (0-2) │
       │                   │             └──────┬──────┘
       │                   │                    │
       │  ┌────────────────┤                    │
       │  │                │                    │
       ▼  ▼                ▼                    ▼
┌──────────────┐    ┌─────────────┐     ┌─────────────┐
│ user_        │    │   cards     │     │ synergy_    │
│ enrollments  │    ├─────────────┤     │ mappings    │
├──────────────┤    │ id (PK)     │     ├─────────────┤
│ user_id (FK) │    │ course_id   │     │ topic_a_id  │
│ course_id(FK)│    │ topic_id    │     │ topic_b_id  │
│ desired_     │    │ front       │     │ name        │
│  retention   │    │ back        │     │ overlap_pct │
│ is_active    │    │ is_synergy  │     │ term_mapping│
└──────────────┘    │ tags (JSON) │     └─────────────┘
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐     ┌─────────────┐
                    │ card_reviews│────▶│ review_logs │
                    ├─────────────┤     ├─────────────┤
                    │ user_id(FK) │     │ card_review │
                    │ card_id(FK) │     │  _id (FK)   │
                    │ difficulty  │     │ rating(1-4) │
                    │ stability   │     │ state_before│
                    │ retrievab.  │     │ state_after │
                    │ state (0-3) │     │ response_ms │
                    │ due         │     │ reviewed_at │
                    │ reps        │     └─────────────┘
                    │ lapses      │
                    └─────────────┘
```

### ゲーミフィケーション系

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   user_xp   │     │   xp_logs   │     │   badges    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ user_id(PK) │     │ user_id(FK) │     │ code(unique)│
│ total_xp    │     │ amount      │     │ name        │
│ level       │     │ source      │     │ icon        │
│ cia_xp      │     │ detail      │     │ category    │
│ cisa_xp     │     │ earned_at   │     │ condition   │
│ cfe_xp      │     └─────────────┘     │ xp_reward   │
└─────────────┘                         └──────┬──────┘
                                               │
                    ┌─────────────┐     ┌──────▼──────┐
                    │ daily_      │     │ user_badges │
                    │ missions    │     ├─────────────┤
                    ├─────────────┤     │ user_id(FK) │
                    │ user_id(FK) │     │ badge_id(FK)│
                    │ mission_date│     │ earned_at   │
                    │ mission_type│     └─────────────┘
                    │ target_value│
                    │ current_val │
                    │ xp_reward   │
                    │ is_completed│
                    └─────────────┘
```

### 学習分析系

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ study_       │    │ user_topic_  │    │ score_       │
│ sessions     │    │ mastery      │    │ predictions  │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ user_id (FK) │    │ user_id (FK) │    │ user_id (FK) │
│ course_id    │    │ topic_id(FK) │    │ course_id    │
│ cards_reviewed│   │ mastery_score│    │ predicted_   │
│ cards_correct│    │ total_reviews│    │  score       │
│ duration_sec │    │ correct_     │    │ pass_prob.   │
│ session_type │    │  reviews     │    │ weak_topic_  │
│ started_at   │    │ avg_response │    │  count       │
│ ended_at     │    │  _ms         │    │ predicted_at │
└──────────────┘    └──────────────┘    └──────────────┘
```

## FSRS (Free Spaced Repetition Scheduler)

[FSRS v6](https://github.com/open-spaced-repetition/py-fsrs) を採用。

### カード状態遷移

```
   New (0) ──Good/Easy──▶ Review (2)
     │                       │
     │ Again               Again
     ▼                       ▼
  Learning (1)          Relearning (3)
     │                       │
     │ Good/Easy           Good/Easy
     └──────────▶ Review (2) ◀┘
```

### レーティング

| Rating | 意味 | 効果 |
|--------|------|------|
| 1 (Again) | 忘れた | 短い間隔で再学習 |
| 2 (Hard) | 難しかった | やや短い間隔 |
| 3 (Good) | 正解 | 標準間隔 |
| 4 (Easy) | 簡単 | 長い間隔 |

### パラメータ

- **Difficulty**: カードの難易度 (0-10)
- **Stability**: 記憶の安定性（日数）
- **Retrievability**: 想起確率 (0-1)
- **Desired Retention**: 目標保持率 (0.7-0.99, デフォルト 0.9)

## LLM 統合

### Azure AI Foundry マルチプロバイダー

```
               ┌─────────────────────────┐
               │    stream_generate()    │
               │    generate()           │
               └───────────┬─────────────┘
                           │
              モデル名で自動ルーティング
                           │
            ┌──────────────┼──────────────┐
            ▼              │              ▼
    ┌───────────┐          │      ┌───────────┐
    │  OpenAI   │          │      │ Anthropic │
    │  GPT-5系  │          │      │ Claude系  │
    ├───────────┤          │      ├───────────┤
    │ gpt-5-mini│ (生成)   │      │ claude-   │
    │ gpt-5-nano│ (チャット)│      │ opus-4-6  │
    │ gpt-5.2-  │ (Flag)   │      │ claude-   │
    │  chat     │          │      │ haiku-4-5 │
    └───────────┘          │      └───────────┘
            │              │              │
            ▼              │              ▼
    AsyncAzureOpenAI       │      AnthropicFoundry
            │              │              │
            └──────────────┼──────────────┘
                           ▼
               Azure AI Foundry Endpoint
               (統一認証・統一エンドポイント)
```

### GPT-5 Reasoning Model の注意事項

| パラメータ | GPT-5 | 従来モデル |
|-----------|-------|-----------|
| トークン上限 | `max_completion_tokens` | `max_tokens` |
| temperature | 1 のみ（省略推奨） | 0-2 |
| reasoning tokens | completion に含まれる | N/A |
| デフォルト上限 | 16384 | 2048-4096 |

## CI/CD パイプライン

```
  Push to main
       │
       ▼
  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ CI       │     │ CD       │     │          │
  │ ─────── │     │ ─────── │     │ Azure    │
  │ API Tests│────▶│ ACR Build│────▶│ Container│
  │ Web Build│     │          │     │ App      │
  │ Docker   │     │          │     │ Update   │
  └──────────┘     └──────────┘     └──────────┘
```

### CI ワークフロー (`.github/workflows/ci.yml`)

- **API Tests**: pytest + PostgreSQL サービスコンテナ
- **Web Build**: Next.js ビルド + 型チェック
- **Docker Build**: Dockerfile.prod のビルド検証

### CD ワークフロー (`.github/workflows/cd.yml`)

- **トリガー**: main ブランチへの push（`apps/api/` または `docker/api/` 変更時）
- **ACR Build**: `az acr build` でコンテナイメージをビルド・プッシュ
- **Deploy**: `az containerapp update` で新リビジョン作成
