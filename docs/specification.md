# GRC Triple Crown (三冠王) -- システム仕様書

> **バージョン**: 0.1.0
> **最終更新**: 2026-02-23
> **ステータス**: 開発中 (Development)

---

## 目次

1. [システム概要](#1-システム概要)
2. [アーキテクチャ](#2-アーキテクチャ)
3. [機能一覧](#3-機能一覧)
4. [データモデル](#4-データモデル)
5. [APIエンドポイント一覧](#5-apiエンドポイント一覧)
6. [LLM統合](#6-llm統合)
7. [プラグインシステム](#7-プラグインシステム)
8. [ゲーミフィケーション設計](#8-ゲーミフィケーション設計)
9. [セキュリティ](#9-セキュリティ)
10. [環境変数一覧](#10-環境変数一覧)

---

## 1. システム概要

### 1.1 プロジェクト情報

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | GRC Triple Crown (三冠王) |
| **リポジトリ** | `GEJFY/sankan-ou` |
| **目的** | CIA / CISA / CFE 3資格の同時学習を、資格間約40%の知識重複を活用してAI駆動で効率化する |
| **ターゲットユーザー** | GRC専門家、内部監査人、リスク管理者、情報システム監査人、不正検査士 |
| **対応資格** | CIA, CISA, CFE (コア3資格) + USCPA, BOKI1, FP, RISS (拡張4資格) |

### 1.2 コンセプト

GRC (Governance, Risk, Compliance) 分野の主要3資格 -- CIA (公認内部監査人)、CISA (公認情報システム監査人)、CFE (公認不正検査士) -- は、内部統制 (COSO)、リスク管理 (ERM)、コーポレートガバナンスなど約40%の知識領域が重複している。

本プラットフォームは以下の技術を組み合わせて、従来の「1資格ずつ順番に学習」アプローチを「3資格同時効率学習」に変革する:

- **FSRS (Free Spaced Repetition Scheduler)**: 科学的間隔反復アルゴリズムによる記憶定着の最適化
- **シナジー学習**: 資格間の共通知識を横断的に学習し、学習効率を最大40%向上
- **AI Tutor**: LLMによる6段階レベル別解説、ソクラテス式対話、知識ブリッジ
- **ゲーミフィケーション**: XP/レベル/バッジ/デイリーミッションによる学習継続の動機付け

### 1.3 技術スタック概要

| レイヤー | 技術 |
|----------|------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python 3.11), async/await, Pydantic v2 |
| Database | PostgreSQL 16 + pgvector |
| SRS Engine | py-fsrs v6 (FSRS algorithm) |
| LLM | Azure AI Foundry (GPT-5系/Claude系) + Google Gemini (fallback) |
| CI/CD | GitHub Actions -> ACR -> Azure Container Apps |
| Container | Docker Compose (dev), Azure Container Apps (prod) |

---

## 2. アーキテクチャ

### 2.1 システム構成図

```
┌──────────────────────────────────────────────────────────┐
│                       Client (Browser)                     │
│  Next.js 15 (App Router / TypeScript / Tailwind CSS v4)    │
│  Port: 3000 (dev) / 3001 (docker)                          │
└──────────────┬──────────────────────────┬─────────────────┘
               │ REST API (JSON)           │ SSE (text/event-stream)
               ▼                           ▼
┌──────────────────────────────────────────────────────────┐
│                    FastAPI Backend                          │
│  Python 3.11 / async / Pydantic v2                         │
│  Port: 8000 (dev) / 8003 (docker)                          │
│  Prefix: /api/v1/                                          │
├──────────────────────────────────────────────────────────┤
│  15 Routers:                                               │
│  health | auth | courses | cards | dashboard | tutor       │
│  questions | synergy | sessions | mock_exam | media         │
│  gamification | enrollments | predictions | admin           │
├──────────────────────────────────────────────────────────┤
│  Services:                                                 │
│  FSRSService | AuthService | GamificationService           │
│  SessionService | ScorePredictionService | MasteryService   │
├──────────────────────────────────────────────────────────┤
│  Plugins: CIA | CISA | CFE | USCPA | BOKI1 | FP | RISS    │
├──────────────────────────────────────────────────────────┤
│  LLM Clients:                                              │
│  AzureAIFoundryClient (GPT-5/Claude) -> GeminiClient       │
└──────────────┬──────────────────────────┬─────────────────┘
               │                           │
               ▼                           ▼
┌────────────────────────┐   ┌────────────────────────────┐
│   PostgreSQL 16        │   │   Azure AI Foundry          │
│   + pgvector           │   │   (GPT-5-mini/nano)         │
│   Port: 5432 (5433)   │   │         +                    │
│   20+ Tables           │   │   Google Gemini (fallback)  │
└────────────────────────┘   └────────────────────────────┘
```

### 2.2 フロントエンド構成

| 区分 | 技術 / 構成 |
|------|------------|
| **フレームワーク** | Next.js 15 (App Router) |
| **言語** | TypeScript |
| **スタイリング** | Tailwind CSS v4 |
| **状態管理** | React Context (AuthContext) |
| **APIクライアント** | fetch ベースのカスタムクライアント (`api-client.ts`) |
| **テーマ** | ダークモード / ライトモード切替 |

**ページ構成** (App Router):

| パス | ページ | 説明 |
|------|--------|------|
| `/` | Dashboard | 進捗サマリー、弱点分析、学習履歴 |
| `/login` | ログイン | JWT認証ログイン |
| `/register` | ユーザー登録 | 新規ユーザー登録 |
| `/study` | SRS学習 | FSRS間隔反復カード学習 |
| `/quiz` | クイズ | LLM問題生成 + 回答 |
| `/tutor` | AI Tutor | SSEチャット、概念解説、比較表 |
| `/synergy` | シナジー学習 | 資格横断学習 |
| `/mock-exam` | 模擬試験 | 資格別模擬試験 |
| `/media` | メディア生成 | AIスライド / 音声スクリプト |
| `/achievements` | 実績 | バッジ / XP / リーダーボード |
| `/strategy` | 受験戦略 | 合格予測 / 学習ROI |
| `/settings` | 設定 | テーマ / 登録コース / パスワード変更 |
| `/admin` | 管理者 | システム統計 / ユーザー管理 |

**主要コンポーネント**:

| カテゴリ | コンポーネント |
|----------|----------------|
| Dashboard | `progress-rings`, `pass-probability`, `streak-badge`, `study-history`, `synergy-map`, `today-tasks`, `weak-points` |
| Study | `flashcard`, `rating-buttons`, `study-progress` |
| AI Tutor | `chat-interface`, `level-selector` |
| Layout | `app-layout`, `sidebar`, `protected-route` |
| UI | `page-header`, `tooltip` |

### 2.3 バックエンド構成

```
apps/api/
├── src/
│   ├── main.py              # FastAPI アプリケーションファクトリ
│   ├── config.py             # pydantic-settings 設定
│   ├── database.py           # SQLAlchemy async エンジン
│   ├── deps.py               # DI (DbSession, CurrentUser)
│   ├── api/v1/
│   │   ├── router.py         # 全ルーター集約
│   │   ├── health.py         # ヘルスチェック
│   │   ├── auth.py           # 認証 (register/login/me/password)
│   │   ├── courses.py        # コース・トピック
│   │   ├── cards.py          # カード・レビュー (FSRS)
│   │   ├── dashboard.py      # ダッシュボード
│   │   ├── tutor.py          # AI Tutor (SSE)
│   │   ├── questions.py      # 問題生成・回答
│   │   ├── synergy.py        # シナジー学習
│   │   ├── sessions.py       # セッション・予測・習熟度
│   │   ├── mock_exam.py      # 模擬試験
│   │   ├── media.py          # メディア生成
│   │   ├── gamification.py   # XP / バッジ / ミッション
│   │   ├── enrollments.py    # コース登録
│   │   ├── predictions.py    # 合格予測・ROI
│   │   └── admin.py          # 管理者機能
│   ├── models/               # SQLAlchemy ORM モデル
│   ├── schemas/              # Pydantic スキーマ
│   ├── services/             # ビジネスロジック
│   ├── llm/                  # LLMクライアント + プロンプト
│   └── plugins/              # 資格プラグイン
├── seed/                     # DBシードデータ
├── alembic/                  # マイグレーション
├── tests/                    # テスト
└── pyproject.toml
```

### 2.4 インフラストラクチャ (Azure)

| リソース | サービス | リージョン |
|----------|----------|------------|
| **Resource Group** | `rg-sankanou` | Japan East |
| **AI Services** | `sankanou-ai` (kind: AIServices) | East US 2 |
| **Container App (API)** | `sankanou-api` | Japan East |
| **Container App (Web)** | `sankanou-web` | Japan East |
| **Container Registry** | `sankanouacr.azurecr.io` | Japan East |
| **PostgreSQL** | `sankanou-db.postgres.database.azure.com` (Flexible Server v16) | Japan East |

**本番URL**: `https://sankanou-api.delightfulbush-953bf077.japaneast.azurecontainerapps.io`

### 2.5 Docker Compose (開発環境)

| サービス | イメージ | ポート | 備考 |
|----------|----------|--------|------|
| `db` | `pgvector/pgvector:pg16` | 5433:5432 | PostgreSQL 16 + pgvector |
| `api` | カスタムビルド | 8003:8000 | FastAPI + Alembic + Seed |
| `web` | カスタムビルド | 3001:3000 | Next.js dev server |

---

## 3. 機能一覧

### 3.1 コース管理

- **7資格対応プラグインシステム**: CIA, CISA, CFE, USCPA, BOKI1, FP, RISS
- コース一覧取得 (デフォルト3資格 / 全7資格)
- コース詳細・トピック階層表示
- ユーザー別コース登録 (Enrollment)
- 目標記憶率 (desired_retention) のカスタマイズ: 0.70 ~ 0.99

### 3.2 SRS学習 (FSRS v6)

- **py-fsrs v6** による科学的間隔反復スケジューリング
- FSRS状態: New (0) -> Learning (1) -> Review (2) -> Relearning (3)
- 4段階評価: Again (1), Hard (2), Good (3), Easy (4)
- DSRモデル: Difficulty, Stability, Retrievability の3パラメータ管理
- 復習期日カード (due cards) の自動取得
- 新規ユーザーへの未学習カード自動割当
- レビューログ (ReviewLog) の不変記録
- ファジング (enable_fuzzing) による復習間隔の自然なばらつき

### 3.3 AI Tutor (6段階解説)

- **6段階レベル別解説**:

| レベル | ラベル | ペルソナ |
|--------|--------|---------|
| 1 | 小学生 | 身近な例え話、専門用語を避ける |
| 2 | 中学生 | 基本概念から丁寧に、簡単な専門用語 |
| 3 | 高校生 | 論理的構造化、因果関係 |
| 4 | 大学生 | 専門用語を交え体系的に |
| 5 | 実務者 | ケーススタディ、実務適用 |
| 6 | 公認会計士 | 規準・基準の解釈、国際比較 |

- **SSEストリーミング**: `text/event-stream` によるリアルタイムレスポンス
- **Markdown出力**: 見出し、太字、表、コードブロック対応
- **フォローアップ質問**: 回答末尾に関連質問3つを自動提案
- **3資格比較表**: CIA/CISA/CFEの観点別比較表を自動生成
- **ソクラテス式対話**: 不正解時に質問で正解に導く教育的対話
- **知識ブリッジ**: 資格間の概念マッピング (例: CIA -> CISA)

### 3.4 問題生成

- **LLM自動生成**: トピック指定で4択問題を自動生成
- バッチ分割: 大量生成時は10問ずつバッチ処理
- 難易度指定: 1 (基礎) ~ 5 (専門家)
- **問題バンク**: DB保存済み問題のランダム取得
- 回答履歴 (QuestionAttempt) の記録
- 正答率・回答時間の追跡

### 3.5 模擬試験

- **各資格の実試験フォーマット対応**:
  - CIA: 3パート (125+100+100問)、75%合格
  - CISA: 5ドメイン (150問)、60%合格
  - CFE: 4セクション (各100問)、75%合格
  - USCPA: 4科目 (AUD/FAR/REG/Discipline)、75%合格
  - BOKI1: 4科目 (100点満点)、70%合格
  - FP: 2部 (基礎+応用)、60%合格
  - RISS: 3区分 (午前I/午前II/午後)、60%合格
- セクション別受験対応
- 結果保存 (MockExamResult) と履歴取得
- 合否判定

### 3.6 ダッシュボード

- **進捗サマリー**: 登録済みコース別の総カード数 / 習得数 / 本日期日数
- **合格確率**: 習得カード比率に基づく概算合格率
- **弱点トピックTOP5**: lapse率に基づく弱点特定
- **学習履歴**: 直近14日間の日別レビュー数・正答数
- **連続学習日数 (Streak)**: 連続ログイン日数の追跡
- **今日の学習数**: 当日レビュー済みカード数

### 3.7 シナジー学習

- **資格間シナジー領域**: 全プラグインから統合したシナジー定義
- シナジーカード (is_synergy=True) の横断学習
- コースフィルタ: 特定資格ペアでの横断出題
- プラグイン詳細: シラバス構造 + シナジー領域 + 試験設定の取得
- **全体概要**: 全資格の重複状況サマリー、平均重複率

### 3.8 ゲーミフィケーション

- **XP (経験値)**: レビュー評価に応じたXP付与
- **30段階レベルシステム**: 累積XPに基づくレベルアップ
- **10種バッジ**: 条件達成で自動付与
- **デイリーミッション**: 毎日3つ自動生成、達成でXP獲得
- **リーダーボード**: XPランキング
- 詳細は [8. ゲーミフィケーション設計](#8-ゲーミフィケーション設計) を参照

### 3.9 メディア生成

- **AIスライド生成**: LLMでプレゼンテーションスライドを自動作成
  - スライド数: 3~20枚指定可能
  - JSON形式: タイトル / 箇条書き / プレゼンターノート / ビジュアル説明
  - Gemini利用時: 各スライドにAI生成画像を付与
- **音声解説スクリプト**: LLMで音声教材スクリプトを自動作成
  - 1~15分指定可能 (1分約150文字)
  - セクション分割 + 理解度チェック質問挿入
  - TTS音声生成: 将来実装予定 (Google Cloud TTS / ElevenLabs)
- **メディア機能状況API**: 対応状況の確認

### 3.10 受験戦略

- **合格確率予測**: 習熟度 (70%) + カード網羅率 (30%) の加重平均
- **弱点トピック分析**: mastery_score < 0.7 のトピックを優先順位付き一覧化
- **学習ROI分析**:
  - 総学習時間の推定 (レビュー数 x 30秒)
  - 残り学習時間の推定 (未習得カード x 5レビュー x 30秒)
  - 習得カード / 残りカード数
- **推奨アクション**: 合格確率に基づく学習戦略アドバイス

### 3.11 管理者機能

- **管理者権限チェック** (`role = "admin"`)
- **システム統計**: ユーザー数、コース数、トピック数、カード数、レビュー数
- **ユーザー一覧**: 全ユーザーの基本情報
- **コース一覧 (拡張)**: DB登録済みコース + プラグイン情報の統合表示
- プラグイン登録数・シナジー概要

### 3.12 テーマ切替 (ダーク / ライトモード)

- フロントエンドでのダーク / ライトモード切替
- 設定ページから変更可能
- ユーザー設定の永続化

---

## 4. データモデル

### 4.1 ER概要

全テーブルはUUID主キー (`UUIDPrimaryKeyMixin`) を使用。主要テーブルは `created_at` / `updated_at` 自動タイムスタンプ (`TimestampMixin`) を持つ。

### 4.2 テーブル一覧

#### ユーザー管理

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| **users** | ユーザーマスター | `id`, `email` (unique), `hashed_password`, `display_name`, `role` (learner/admin), `fsrs_parameters` (JSONB), `is_active` |
| **user_enrollments** | ユーザー x コース登録 | `id`, `user_id` (FK), `course_id` (FK), `desired_retention` (default 0.9), `is_active` |

#### コース・コンテンツ

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| **courses** | コースマスター | `id`, `code` (unique, e.g. "CIA"), `name`, `description`, `color` (hex), `exam_config` (JSONB), `is_active`, `is_default`, `sort_order` |
| **topics** | トピック階層 | `id`, `course_id` (FK), `parent_id` (FK/self), `name`, `description`, `weight_pct`, `level` (0=Part, 1=Domain, 2=Topic), `sort_order` |
| **cards** | 学習カード | `id`, `course_id` (FK), `topic_id` (FK), `front`, `back`, `is_synergy`, `level_explanations` (JSONB), `tags` (JSONB), `difficulty_tier` (1-3) |

#### FSRS (間隔反復)

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| **card_reviews** | ユーザー x カードのFSRS状態 | `id`, `user_id` (FK), `card_id` (FK), `difficulty`, `stability`, `retrievability`, `state` (0-3), `due`, `last_review`, `reps`, `lapses` |
| **review_logs** | レビュー履歴 (不変) | `id`, `card_review_id` (FK), `rating` (1-4), `state_before`, `state_after`, `difficulty_before/after`, `stability_before/after`, `response_time_ms`, `reviewed_at` |

#### 学習セッション・分析

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| **study_sessions** | 学習セッション | `id`, `user_id` (FK), `course_id` (FK), `cards_reviewed`, `cards_correct`, `duration_seconds`, `session_type` (review/quiz/tutor/synergy), `started_at`, `ended_at` |
| **user_topic_mastery** | トピック別習熟度 (キャッシュ) | `id`, `user_id` (FK), `topic_id` (FK), `mastery_score` (0.0-1.0), `total_reviews`, `correct_reviews`, `avg_response_ms` |
| **score_predictions** | 合格確率予測 | `id`, `user_id` (FK), `course_id` (FK), `predicted_score`, `pass_probability`, `weak_topic_count`, `predicted_at` |

#### 問題・模擬試験

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| **questions** | LLM生成問題 | `id`, `course_id` (FK), `topic_id` (FK), `stem`, `choices` (JSONB), `explanation`, `difficulty` (1-5), `format` (multiple_choice/scenario), `source` (llm/manual) |
| **question_attempts** | 回答履歴 | `id`, `user_id` (FK), `question_id` (FK), `selected_index`, `is_correct`, `response_time_ms`, `attempted_at` |
| **mock_exam_results** | 模擬試験結果 | `id`, `user_id` (FK), `course_id` (FK), `course_code`, `score_pct`, `correct_count`, `total_questions`, `passed`, `passing_score_pct`, `time_taken_seconds`, `question_ids` (JSONB), `answer_indices` (JSONB) |

#### ゲーミフィケーション

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| **user_xp** | ユーザーXP・レベル | `id`, `user_id` (FK, unique), `total_xp`, `level`, `cia_xp`, `cisa_xp`, `cfe_xp` |
| **xp_logs** | XP獲得履歴 | `id`, `user_id` (FK), `amount`, `source`, `detail`, `earned_at` |
| **badges** | バッジ定義マスター | `id`, `code` (unique), `name`, `description`, `icon`, `category` (streak/mastery/volume/synergy/speed), `condition` (JSONB), `xp_reward` |
| **user_badges** | ユーザー獲得バッジ | `id`, `user_id` (FK), `badge_id` (FK), `earned_at` |
| **daily_missions** | デイリーミッション | `id`, `user_id` (FK), `mission_date`, `mission_type`, `title`, `target_value`, `current_value`, `xp_reward`, `is_completed`, `completed_at` |

#### シナジー

| テーブル | 説明 | 主要カラム |
|----------|------|------------|
| **synergy_mappings** | 資格間知識重複マッピング | `id`, `topic_a_id` (FK), `topic_b_id` (FK), `name`, `description`, `overlap_pct`, `term_mappings` (JSONB) |

### 4.3 FSRS状態遷移

```
   New (0)
     │
     │ 初回レビュー
     ▼
  Learning (1)
     │
     │ 一定回数Good以上
     ▼
  Review (2)  ←────┐
     │              │
     │ Again        │ Good/Easy
     ▼              │
  Relearning (3) ──┘
```

---

## 5. APIエンドポイント一覧

**ベースパス**: `/api/v1`

> 詳細なリクエスト / レスポンススキーマは `docs/api.md` を参照。

### 5.1 Health

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/health` | - | ヘルスチェック (DB接続検証含む) |

### 5.2 Auth (認証)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| POST | `/auth/register` | - | ユーザー登録 |
| POST | `/auth/login` | - | ログイン (JWTトークン発行) |
| GET | `/auth/me` | JWT | 現在のユーザー情報取得 |
| PUT | `/auth/password` | JWT | パスワード変更 |

### 5.3 Courses (コース)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/courses` | - | コース一覧 (`include_all` パラメータで全コース表示) |
| GET | `/courses/{course_id}` | - | コース詳細 |
| GET | `/courses/{course_id}/topics` | - | コース別トピック一覧 (level=1) |

### 5.4 Cards (カード・レビュー)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/cards/due` | JWT | 復習期日到来カード取得 (`course_id`, `limit` フィルタ) |
| POST | `/cards/review` | JWT | レビュー結果送信 -> FSRS状態更新 |

### 5.5 Dashboard (ダッシュボード)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/dashboard/summary` | JWT | 登録済み資格の進捗サマリー |
| GET | `/dashboard/weak-topics` | JWT | 弱点トピックTOP5 |
| GET | `/dashboard/history` | JWT | 直近14日の学習履歴 |

### 5.6 AI Tutor

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| POST | `/ai-tutor/explain` | - | 概念解説 (SSEストリーミング) |
| POST | `/ai-tutor/compare` | - | 3資格比較表生成 (SSEストリーミング) |
| POST | `/ai-tutor/chat` | - | 一般Q&A (SSEストリーミング) |
| POST | `/ai-tutor/socratic` | - | ソクラテス式対話 (SSEストリーミング) |
| POST | `/ai-tutor/bridge` | - | 知識ブリッジ - 資格間概念マッピング (SSEストリーミング) |

### 5.7 Questions (問題生成)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/questions/bank` | JWT | DB保存済み問題のランダム取得 |
| POST | `/questions/generate` | JWT | LLMで練習問題を自動生成 (バッチ対応) |
| POST | `/questions/answer` | JWT | 回答送信 |

### 5.8 Synergy (シナジー学習)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/synergy/areas` | - | 全資格間シナジー領域一覧 |
| GET | `/synergy/course/{course_code}` | - | コースプラグイン詳細 (シラバス + シナジー + 試験設定) |
| GET | `/synergy/study` | - | シナジー学習カード取得 (横断出題) |
| GET | `/synergy/overview` | - | 全資格シナジー概要 |

### 5.9 Sessions (学習セッション)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| POST | `/sessions/start` | JWT | 学習セッション開始 |
| POST | `/sessions/end` | JWT | 学習セッション終了 |
| GET | `/sessions/recent` | JWT | 直近セッション一覧 |
| GET | `/sessions/today` | JWT | 今日の学習統計 + 連続日数 |

### 5.10 Predictions (合格予測)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/sessions/predictions/{course_id}` | JWT | 合格確率予測 (sessions router内) |
| GET | `/sessions/predictions/{course_id}/roi` | JWT | 学習ROI推定 (sessions router内) |
| GET | `/predictions/{course_id}` | JWT | コース別合格予測 (詳細版) |
| GET | `/predictions/{course_id}/roi` | JWT | 学習ROI分析 (詳細版) |

### 5.11 Mastery (習熟度)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/sessions/mastery/{course_id}` | JWT | コース内トピック別習熟度 |

### 5.12 Mock Exam (模擬試験)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| POST | `/mock-exam/start` | - | 模擬試験開始 (試験設定取得) |
| GET | `/mock-exam/config/{course_code}` | - | 試験設定取得 |
| POST | `/mock-exam/submit` | JWT | 模擬試験結果を保存 |
| GET | `/mock-exam/history` | JWT | 模擬試験履歴取得 |

### 5.13 Media (メディア生成)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| POST | `/media/slides/generate` | - | AIスライド自動生成 |
| POST | `/media/audio/script` | - | 音声解説スクリプト生成 |
| GET | `/media/capabilities` | - | メディア機能の対応状況 |

### 5.14 Gamification (ゲーミフィケーション)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/gamification/profile` | JWT | ゲーミフィケーションプロフィール |
| GET | `/gamification/missions` | JWT | 今日のデイリーミッション |
| GET | `/gamification/xp/history` | JWT | XP獲得履歴 |
| GET | `/gamification/badges` | JWT | 獲得バッジ一覧 |
| GET | `/gamification/leaderboard` | - | XPリーダーボード |
| POST | `/gamification/xp/award` | JWT | XP手動付与 (テスト/管理用) |

### 5.15 Enrollments (コース登録)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/enrollments` | JWT | 登録コース一覧 |
| POST | `/enrollments` | JWT | コースに登録 |
| PUT | `/enrollments/{id}/retention` | JWT | 目標記憶率の更新 |
| DELETE | `/enrollments/{id}` | JWT | コース登録を無効化 (ソフトデリート) |

### 5.16 Admin (管理者)

| メソッド | パス | 認証 | 説明 |
|----------|------|------|------|
| GET | `/admin/stats` | JWT (admin) | システム統計情報 |
| GET | `/admin/users` | JWT (admin) | ユーザー一覧 |
| GET | `/admin/courses` | JWT (admin) | コース一覧 (DB + プラグイン情報) |

### 5.17 エンドポイント統計

| カテゴリ | エンドポイント数 |
|----------|------------------|
| Health | 1 |
| Auth | 4 |
| Courses | 3 |
| Cards | 2 |
| Dashboard | 3 |
| AI Tutor | 5 |
| Questions | 3 |
| Synergy | 4 |
| Sessions | 4 |
| Predictions | 4 |
| Mastery | 1 |
| Mock Exam | 4 |
| Media | 3 |
| Gamification | 6 |
| Enrollments | 4 |
| Admin | 3 |
| **合計** | **54** |

---

## 6. LLM統合

### 6.1 マルチプロバイダーアーキテクチャ

```
                 ┌──────────────────────────────┐
                 │   統一インターフェース         │
                 │   generate() / stream_generate()│
                 └──────────┬────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
     ┌────────────┐  ┌───────────┐  ┌───────────┐
     │ OpenAI系   │  │ Anthropic │  │ Gemini    │
     │ (GPT-5)    │  │ (Claude)  │  │ (fallback)│
     │ via Azure  │  │ via Azure │  │ Vertex AI │
     │ AI Foundry │  │ AI Foundry│  │ / API Key │
     └────────────┘  └───────────┘  └───────────┘
```

**優先順位**: Azure AI Foundry (GPT-5/Claude) -> Google Gemini (フォールバック)

### 6.2 利用可能モデル

| モデルID | プロバイダー | 用途 | コンテキスト長 | 備考 |
|----------|-------------|------|---------------|------|
| `gpt-5-mini` | OpenAI (Azure) | 解説生成・問題生成 | 1M tokens | GA / コスパ最良 |
| `gpt-5-nano` | OpenAI (Azure) | チャット・軽量処理 | 1M tokens | GA / 超低コスト |
| `gpt-5.2-chat` | OpenAI (Azure) | フラグシップ | 400K tokens | Preview |
| `claude-opus-4-6` | Anthropic (Azure) | 最高品質 | 1M tokens | Preview / MCA-E要 |
| `claude-haiku-4-5` | Anthropic (Azure) | 高速 | 200K tokens | Preview / MCA-E要 |
| `gemini-2.5-flash` | Google | テキスト生成 (fallback) | - | Vertex AI / API Key |
| `gemini-2.5-flash-image` | Google | 画像生成 (スライド) | - | Vertex AI / API Key |

### 6.3 モデルルーティング

- **環境変数で切替可能**: `LLM_MODEL_GENERATION` / `LLM_MODEL_CHAT`
- **デフォルト**: 生成=`gpt-5-mini`, チャット=`gpt-5-nano`
- **自動ルーティング**: モデル名のプレフィックスで判定
  - `gpt-5*` -> OpenAI SDK (`AsyncAzureOpenAI`)
  - `claude-*` -> Anthropic SDK (`AnthropicFoundry`)
- **フォールバック**: Azure失敗時 -> Geminiに自動切替

### 6.4 GPT-5 Reasoning Model 注意事項

GPT-5系はReasoning Modelのため、以下の制約がある:

| 項目 | 通常モデル | GPT-5 Reasoning |
|------|-----------|----------------|
| トークン上限パラメータ | `max_tokens` | `max_completion_tokens` |
| temperature | 0.0 ~ 2.0 | 1 のみ (省略推奨) |
| reasoning tokens | なし | completion tokensに含まれる |
| 推奨max_completion_tokens | 4096 | 16384 (reasoning分を考慮) |

### 6.5 LLM利用箇所

| 機能 | デフォルトモデル | 出力形式 | 備考 |
|------|-----------------|---------|------|
| AI Tutor - 概念解説 | MODEL_GENERATION | SSEストリーミング | Markdown形式 |
| AI Tutor - 比較表 | MODEL_GENERATION | SSEストリーミング | テーブル形式 |
| AI Tutor - チャット | MODEL_CHAT | SSEストリーミング | |
| AI Tutor - ソクラテス式 | MODEL_GENERATION | SSEストリーミング | |
| AI Tutor - ブリッジ | MODEL_GENERATION | SSEストリーミング | |
| 問題生成 | MODEL_GENERATION | JSON (非ストリーミング) | max_tokens=8192 |
| スライド生成 | MODEL_GENERATION | JSON (非ストリーミング) | + Gemini画像生成 |
| 音声スクリプト | MODEL_GENERATION | JSON (非ストリーミング) | |

### 6.6 プロンプトテンプレート

**AI Tutorプロンプト** (`src/llm/prompts/tutor.py`):

| 関数 | 用途 | 出力 |
|------|------|------|
| `build_explain_prompt()` | レベル別概念解説 | system + user プロンプト |
| `build_compare_prompt()` | 3資格比較表 | system + user プロンプト |
| `build_socratic_prompt()` | ソクラテス式対話 | system + user プロンプト |
| `build_knowledge_bridge_prompt()` | 資格間ブリッジ | system + user プロンプト |

**問題生成プロンプト** (`src/llm/prompts/question_gen.py`):

- `build_question_gen_prompt()`: トピック名 + コースコード + 問題数 + 難易度からプロンプト生成

---

## 7. プラグインシステム

### 7.1 アーキテクチャ

```
CoursePlugin (base class)
    ├── CIAPlugin      (CIA)
    ├── CISAPlugin     (CISA)
    ├── CFEPlugin      (CFE)
    ├── USCPAPlugin    (USCPA)
    ├── Boki1Plugin    (BOKI1)
    ├── FPPlugin       (FP)
    └── RISSPlugin     (RISS)
```

### 7.2 CoursePlugin 基底クラス

```python
class CoursePlugin:
    # 必須プロパティ
    course_code: str       # "CIA", "CISA", etc.
    course_name: str       # 正式名称
    description: str       # 説明
    color: str             # テーマカラー (hex)
    icon: str              # アイコン (emoji)
    exam_config: ExamConfig  # 試験設定

    # 必須メソッド
    def get_syllabus() -> list[TopicDef]      # シラバス階層
    def get_synergy_areas() -> list[SynergyDef]  # シナジー定義

    # 自動提供メソッド
    def get_question_gen_system_prompt(difficulty)  # 問題生成プロンプト
    def get_card_gen_prompt(topic_name)             # カード生成プロンプト
```

### 7.3 ExamConfig

```python
@dataclass
class ExamConfig:
    total_questions: int     # 総問題数
    duration_minutes: int    # 総試験時間 (分)
    passing_score: float     # 合格ライン (0.0 - 1.0)
    sections: list[dict]     # セクション定義
    format_notes: str        # フォーマットの補足説明
```

### 7.4 7資格プラグイン一覧

| コード | 資格名 | 認定団体 | カラー | 問題数 | 時間 | 合格ライン |
|--------|--------|----------|--------|--------|------|-----------|
| **CIA** | 公認内部監査人 | IIA | `#e94560` | 325問 (3パート) | 390分 | 75% |
| **CISA** | 公認情報システム監査人 | ISACA | `#0891b2` | 150問 (5ドメイン) | 240分 | 60% |
| **CFE** | 公認不正検査士 | ACFE | `#7c3aed` | 400問 (4セクション) | 480分 | 75% |
| **USCPA** | 米国公認会計士 | AICPA/NASBA | `#059669` | 279問 (4科目) | 960分 | 75% |
| **BOKI1** | 日商簿記検定1級 | 日商 | `#d97706` | 100点 (4科目) | 180分 | 70% |
| **FP** | FP技能士 | 金財 | `#2563eb` | 65問 (2部) | 300分 | 60% |
| **RISS** | 情報処理安全確保支援士 | IPA | `#dc2626` | 59問 (3区分) | 240分 | 60% |

### 7.5 シナジー領域 (主要)

| シナジー領域 | 重複率 | 関連資格 |
|-------------|--------|---------|
| 内部統制フレームワーク (COSO) | 92% | CIA, CISA, CFE, USCPA |
| 監査プロセス・方法論 | 90% | USCPA, CIA, CISA |
| リスク管理 (ERM) | 88% | CIA, CISA, CFE |
| 不正リスク管理 | 88% | CFE, CIA |
| 財務会計・財務報告 | 88% | BOKI1, USCPA, CIA |
| 情報セキュリティガバナンス | 88% | RISS, CISA, CIA |
| コーポレートガバナンス | 85% | CIA, CISA, CFE |
| ITガバナンスフレームワーク | 85% | CISA, CIA |
| IT統制・アクセス管理 | 85% | RISS, CISA, CIA |
| 不正リスク評価 | 85% | USCPA, CIA, CFE |
| 原価計算・管理会計 | 85% | BOKI1, USCPA |
| 税務・タックスプランニング | 82% | FP, USCPA, BOKI1 |
| 監査プロセス・手法 | 82% | CISA, CIA, CFE |
| 連結会計・企業結合 | 82% | BOKI1, USCPA |
| インシデント対応・BCP | 80% | RISS, CISA, CIA |
| 企業ガバナンス | 80% | USCPA, CIA, CISA |

### 7.6 TopicDef / SynergyDef

```python
@dataclass
class TopicDef:
    name: str                     # トピック名
    weight_pct: float             # 出題比率 (%)
    children: list[TopicDef]      # 子トピック
    keywords: list[str]           # キーワード

@dataclass
class SynergyDef:
    area_name: str                # シナジー領域名
    overlap_pct: float            # 重複率 (%)
    related_courses: list[str]    # 関連資格コード
    term_mappings: dict[str, str] # 資格別の用語対応
```

### 7.7 6段階レベル別解説

| レベル | ラベル | ペルソナ |
|--------|--------|---------|
| 1 | 小学生 | 身近な例えを使って |
| 2 | 中学生 | 基本概念を丁寧に、因果関係を含めて |
| 3 | 高校生 | 論理的に構造化して、専門用語を少しずつ導入 |
| 4 | 大学生 | 専門用語を交えて体系的に |
| 5 | 実務者 | ケーススタディを含めて |
| 6 | 公認会計士 | 規準・基準の解釈を含めて |

---

## 8. ゲーミフィケーション設計

### 8.1 XP (経験値) 配分

| アクション | 獲得XP | 備考 |
|-----------|--------|------|
| レビュー: Again (1) | 5 XP | |
| レビュー: Hard (2) | 10 XP | |
| レビュー: Good (3) | 15 XP | |
| レビュー: Easy (4) | 25 XP | |
| クイズ正解 | 20 XP | |
| シナジーボーナス | +10 XP | シナジーカードレビュー時に加算 |
| 連続ログインボーナス | 50 XP | ストリークボーナス |
| ミッション完了 | 可変 | ミッション定義に従う (30~60 XP) |
| バッジ獲得 | 可変 | バッジ定義に従う (20~500 XP) |

### 8.2 レベルシステム (30段階)

| レベル | 必要累積XP | レベル | 必要累積XP | レベル | 必要累積XP |
|--------|-----------|--------|-----------|--------|-----------|
| 1 | 0 | 11 | 6,600 | 21 | 43,000 |
| 2 | 100 | 12 | 8,200 | 22 | 51,000 |
| 3 | 300 | 13 | 10,000 | 23 | 60,000 |
| 4 | 600 | 14 | 12,000 | 24 | 70,000 |
| 5 | 1,000 | 15 | 14,500 | 25 | 82,000 |
| 6 | 1,500 | 16 | 17,500 | 26 | 96,000 |
| 7 | 2,200 | 17 | 21,000 | 27 | 112,000 |
| 8 | 3,000 | 18 | 25,000 | 28 | 130,000 |
| 9 | 4,000 | 19 | 30,000 | 29 | 150,000 |
| 10 | 5,200 | 20 | 36,000 | 30 | 175,000 |

Lv30以降: 前レベル + 30,000 XP ずつ増加

### 8.3 バッジ一覧 (10種)

| コード | 名称 | カテゴリ | 条件 | XP報酬 |
|--------|------|----------|------|--------|
| `first_review` | はじめの一歩 | volume | カード1枚レビュー | 20 |
| `reviews_50` | 勤勉な学習者 | volume | カード50枚レビュー | 100 |
| `reviews_100` | 百枚マスター | volume | カード100枚レビュー | 200 |
| `reviews_500` | 知識の探求者 | volume | カード500枚レビュー | 500 |
| `streak_3` | 3日連続 | streak | 3日連続学習 | 50 |
| `streak_7` | ウィークリーチャンピオン | streak | 7日連続学習 | 150 |
| `streak_30` | 月間マスター | streak | 30日連続学習 | 500 |
| `synergy_first` | シナジー入門 | synergy | シナジーカード初レビュー | 30 |
| `triple_crown` | 三冠王 | mastery | 3資格すべてでレビュー実施 | 200 |
| `perfect_session` | パーフェクト | mastery | 1セッション全問Good以上 (10枚以上) | 100 |

### 8.4 デイリーミッション

毎日3つのミッションが `MISSION_TEMPLATES` からランダム選出される。

| ミッションタイプ | タイトル例 | 目標値 | XP報酬 |
|-----------------|-----------|--------|--------|
| `review_cards` | カードを10枚レビューしよう | 10 | 30 |
| `review_cards` | カードを20枚レビューしよう | 20 | 50 |
| `review_good` | Good以上で5枚回答しよう | 5 | 30 |
| `review_good` | Good以上で10枚回答しよう | 10 | 50 |
| `synergy_study` | シナジーカードを5枚学習しよう | 5 | 40 |
| `multi_course` | 2つの資格のカードをレビューしよう | 2 | 35 |
| `multi_course` | 3つの資格のカードをレビューしよう | 3 | 60 |
| `speed_review` | 15枚を10分以内にレビューしよう | 15 | 45 |

### 8.5 資格別XP

`user_xp` テーブルは `cia_xp`, `cisa_xp`, `cfe_xp` を個別に追跡。資格別の学習バランスを可視化。

---

## 9. セキュリティ

### 9.1 認証

| 項目 | 実装 |
|------|------|
| **認証方式** | JWT (JSON Web Token) |
| **署名アルゴリズム** | HS256 (HMAC-SHA256) |
| **トークン有効期限** | 24時間 (1440分) |
| **トークン取得** | `POST /auth/login` -> `access_token` |
| **トークン送信** | `Authorization: Bearer <token>` |
| **パスワードハッシュ** | bcrypt (passlib) |
| **ユーザー認証** | `HTTPBearer` スキーム |

### 9.2 認可

| ロール | 権限 |
|--------|------|
| `learner` | 一般機能すべて (学習、ダッシュボード、設定) |
| `admin` | learner権限 + 管理者API (`/admin/*`) |

### 9.3 セキュリティヘッダー

`SecurityHeadersMiddleware` により全レスポンスに以下のヘッダーを付与:

| ヘッダー | 値 | 説明 |
|----------|-----|------|
| `X-Content-Type-Options` | `nosniff` | MIMEスニッフィング防止 |
| `X-Frame-Options` | `DENY` | クリックジャッキング防止 |
| `X-XSS-Protection` | `1; mode=block` | XSS防止 (レガシーブラウザ) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | リファラー制御 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HSTS (本番のみ) |

### 9.4 CORS

- **開発環境ホワイトリスト**:
  - `http://localhost:3000`
  - `http://localhost:3001`
  - `http://localhost:8003`
- `allow_credentials: True`
- `allow_methods: ["*"]`
- `allow_headers: ["*"]`
- 本番環境では環境変数 `CORS_ORIGINS` で制限

### 9.5 その他のセキュリティ対策

| 対策 | 詳細 |
|------|------|
| **パスワード最小要件** | Pydanticスキーマで制約 |
| **メール重複チェック** | 登録時にUNIQUE制約で検証 |
| **ソフトデリート** | ユーザー/エンロールメントの無効化 (`is_active=False`) |
| **API Key保護** | 環境変数 (.env) でのみ管理、コードに直接記載しない |
| **DB接続** | asyncpg (非同期) + SQLAlchemy async セッション |

---

## 10. 環境変数一覧

### 10.1 データベース

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `DATABASE_URL` | はい | `postgresql+asyncpg://sankanou:sankanou_dev@localhost:5433/sankanou` | PostgreSQL接続文字列 |
| `POSTGRES_USER` | - | `sankanou` | Docker Compose用 DB ユーザー名 |
| `POSTGRES_PASSWORD` | - | `sankanou_dev` | Docker Compose用 DB パスワード |
| `POSTGRES_DB` | - | `sankanou` | Docker Compose用 DB 名 |

### 10.2 API サーバー

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `API_HOST` | - | `0.0.0.0` | APIサーバーホスト |
| `API_PORT` | - | `8000` | APIサーバーポート |
| `API_RELOAD` | - | `True` | 自動リロード (開発用) |
| `DEBUG` | - | `False` | デバッグモード |

### 10.3 認証

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `JWT_SECRET` | はい | `change-me-in-production` | JWT署名用シークレットキー (本番では必ず変更) |
| `JWT_ALGORITHM` | - | `HS256` | JWT署名アルゴリズム |
| `JWT_EXPIRE_MINUTES` | - | `1440` | JWTトークン有効期間 (分) |

### 10.4 Azure AI Foundry

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `AZURE_FOUNDRY_ENDPOINT` | 条件付き | `""` | Azure AI Foundryエンドポイント |
| `AZURE_FOUNDRY_API_KEY` | 条件付き | `""` | Azure AI Foundry APIキー |
| `AZURE_FOUNDRY_API_VERSION` | - | `2024-12-01-preview` | APIバージョン |

### 10.5 LLM モデル選択

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `LLM_MODEL_GENERATION` | - | `gpt-5-mini` | 解説/問題生成用モデル |
| `LLM_MODEL_CHAT` | - | `gpt-5-nano` | チャット/軽量処理用モデル |

### 10.6 Google Gemini

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `GOOGLE_GEMINI_API_KEY` | 条件付き | `""` | Gemini直接APIキー (Vertex AI使用時は不要) |
| `GOOGLE_GEMINI_PROJECT` | 条件付き | `""` | GCPプロジェクトID (Vertex AI用) |
| `GOOGLE_GEMINI_LOCATION` | - | `us-central1` | Vertex AIリージョン |
| `GOOGLE_GEMINI_MODEL` | - | `gemini-2.5-flash` | テキスト生成モデル |
| `GOOGLE_GEMINI_IMAGE_MODEL` | - | `gemini-2.5-flash-image` | 画像生成モデル |

### 10.7 CORS

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `CORS_ORIGINS` | - | `["http://localhost:3000", "http://localhost:3001", "http://localhost:8003"]` | 許可オリジン (JSON配列) |

### 10.8 フロントエンド

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `NEXT_PUBLIC_API_URL` | はい | `http://localhost:8003` | バックエンドAPIのベースURL |

### 10.9 LLM認証の要件

Azure AI Foundry または Google Gemini のいずれかが設定されている必要がある:

- **Azure AI Foundry**: `AZURE_FOUNDRY_ENDPOINT` + `AZURE_FOUNDRY_API_KEY` の両方を設定
- **Google Gemini (Vertex AI)**: `GOOGLE_GEMINI_PROJECT` を設定 + ADC認証
- **Google Gemini (直接API)**: `GOOGLE_GEMINI_API_KEY` を設定

両方設定した場合、Azure AI Foundryが優先され、失敗時にGeminiへフォールバックする。

---

> **付録: 開発コマンド**
>
> ```bash
> # Docker環境起動
> docker compose up -d
>
> # Backend (apps/api/)
> cd apps/api
> pip install -e ".[dev]"
> uvicorn src.main:app --reload --port 8000
> python -m pytest tests/ -v
>
> # DB seed
> python -m seed.seed_db
>
> # Alembic migration
> alembic upgrade head
> alembic revision --autogenerate -m "description"
>
> # Frontend (apps/web/)
> cd apps/web
> npm install
> npm run dev
> ```
