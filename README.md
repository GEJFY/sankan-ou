# GRC Triple Crown (三冠王)

[![CI](https://github.com/GEJFY/sankan-ou/actions/workflows/ci.yml/badge.svg)](https://github.com/GEJFY/sankan-ou/actions/workflows/ci.yml)
![Python 3.11](https://img.shields.io/badge/Python-3.11-3776ab?logo=python&logoColor=white)
![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)

AI駆動型 CIA / CISA / CFE 3資格同時学習プラットフォーム

## 特徴

### 学習エンジン

- **FSRS v6** によるスペーシングリピティション（間隔反復）で最適な復習タイミングを自動計算
- **シナジー学習** - CIA/CISA/CFE 間の約40%の知識重複を活用した効率的学習（5-50枚対応）
- **模擬試験** - 各資格の本番形式に準拠した問題生成
- **問題演習のローディングUI** - スケルトン表示によるスムーズな体験

### AI 機能

- **GPT-5 AI Tutor** がリアルタイムで概念解説・ソクラテス式対話・3資格比較を提供
- **AI Tutor Markdown 対応** - コードブロック・テーブル等のリッチ表示 + TTS 音声読み上げ
- **フォローアップ質問** - AI が文脈を踏まえた追加質問を自動提案
- **AI スライド生成** - トピック別スライドを自動生成（日本語強制、JSON ダウンロード対応）

### ゲーミフィケーション・UX

- **ゲーミフィケーション** - XP・レベル・バッジ・デイリーミッションで学習継続を促進
- **テーマ切替** - ダークモード / ライトモード対応
- **プロフェッショナル UI** - ツールチップ・レスポンシブデザイン・アクセシビリティ

### マルチ LLM

- **Azure AI Foundry** 経由のマルチプロバイダー対応
  - GPT-5 系: GPT-5-mini（生成）、GPT-5-nano（チャット）、GPT-5.2-chat（フラグシップ）
  - Anthropic 系: Claude Opus 4.6、Claude Haiku 4.5
  - Google Gemini フォールバック（Vertex AI 経由）
- 環境変数でモデル切替可能、自動フォールバック機能付き

## アーキテクチャ

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Next.js 15 │────▶│  FastAPI     │────▶│  PostgreSQL 16   │
│  (Frontend)  │     │  (API)       │     │  + pgvector      │
└─────────────┘     └──────┬──────┘     └──────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Azure AI    │
                    │ Foundry     │
                    │ GPT-5 /     │
                    │ Claude /    │
                    │ Gemini      │
                    └─────────────┘
```

| レイヤー | 技術スタック |
|----------|-------------|
| Frontend | Next.js 15, App Router, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, async, Pydantic v2 |
| Database | PostgreSQL 16 + pgvector (Azure Flexible Server / Docker) |
| SRS | py-fsrs v6 (FSRS algorithm) |
| LLM | Azure AI Foundry (GPT-5 / Claude / Gemini マルチプロバイダー) |
| CI/CD | GitHub Actions → ACR → Azure Container Apps |

## クイックスタート

### 前提条件

- Docker / Docker Compose (v24+)
- Node.js 20+
- Python 3.11+

### ローカル開発

```bash
# 1. リポジトリをクローン
git clone https://github.com/GEJFY/sankan-ou.git
cd sankan-ou

# 2. 環境変数を設定
cp .env.example .env
# .env を編集して Azure AI Foundry の認証情報を設定

# 3. Docker Compose で起動
docker compose up -d

# 4. DB シード投入
docker compose exec api python -m seed.seed_db

# 5. アクセス
# API:  http://localhost:8003/docs
# Web:  http://localhost:3001
```

### 個別起動（Docker なし）

```bash
# Backend
cd apps/api
pip install -e ".[dev]"
alembic upgrade head
uvicorn src.main:app --reload --port 8000

# Frontend
cd apps/web
npm install
npm run dev
```

> 詳細なセットアップ手順は [開発者セットアップガイド](docs/setup-guide.md) を参照。

## テスト

**115 テスト** (34 既存 + 81 新規) で品質を担保。

```bash
# バックエンドテスト
cd apps/api
python -m pytest tests/ -v

# カバレッジレポート
python -m pytest tests/ --cov=src --cov-report=html

# フロントエンドビルド確認
cd apps/web
npm run build
```

## プロジェクト構成

```
sankan-ou/
├── apps/
│   ├── api/                    # FastAPI バックエンド
│   │   ├── src/
│   │   │   ├── api/v1/         # ルートハンドラー
│   │   │   ├── models/         # SQLAlchemy ORM モデル
│   │   │   ├── schemas/        # Pydantic スキーマ
│   │   │   ├── services/       # ビジネスロジック (FSRS, Auth)
│   │   │   ├── llm/            # LLM クライアント + プロンプト
│   │   │   └── plugins/        # コース別プラグイン
│   │   ├── seed/               # DB シードデータ + シラバス JSON
│   │   └── tests/              # pytest テスト
│   └── web/                    # Next.js フロントエンド
│       └── src/
│           ├── app/            # App Router ページ
│           ├── components/     # React コンポーネント
│           ├── hooks/          # カスタムフック
│           ├── lib/            # ユーティリティ
│           └── types/          # TypeScript 型定義
├── docker/                     # Dockerfile (dev / prod)
├── docs/                       # ドキュメント
├── .github/workflows/          # CI/CD
├── deploy.sh / deploy.ps1      # Azure デプロイスクリプト
└── docker-compose.yml          # ローカル開発用
```

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [システム仕様書](docs/specification.md) | 機能要件・非機能要件 |
| [ユーザーマニュアル](docs/user-manual.md) | エンドユーザー向け操作ガイド |
| [開発者セットアップ](docs/setup-guide.md) | 環境構築・開発手順 |
| [API リファレンス](docs/api.md) | 全エンドポイント仕様 |
| [アーキテクチャ](docs/architecture.md) | DB スキーマ・システム設計 |
| [デプロイメント](docs/deployment.md) | Azure 環境構築手順 |

## 対応資格

| 資格 | カラー | 概要 |
|------|--------|------|
| **CIA** (公認内部監査人) | ![#e94560](https://placehold.co/15x15/e94560/e94560.png) `#e94560` | IIA 主催、3パート構成 |
| **CISA** (公認情報システム監査人) | ![#0891b2](https://placehold.co/15x15/0891b2/0891b2.png) `#0891b2` | ISACA 主催、5ドメイン |
| **CFE** (公認不正検査士) | ![#7c3aed](https://placehold.co/15x15/7c3aed/7c3aed.png) `#7c3aed` | ACFE 主催、4セクション |

## ライセンス

Private
