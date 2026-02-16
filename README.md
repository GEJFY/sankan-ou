# GRC Triple Crown (三冠王)

AI駆動型 CIA / CISA / CFE 3資格同時学習プラットフォーム

## 特徴

- **FSRS v6** によるスペーシングリピティション（間隔反復）で最適な復習タイミングを自動計算
- **GPT-5 AI Tutor** がリアルタイムで概念解説・ソクラテス式対話・3資格比較を提供
- **シナジー学習** - CIA/CISA/CFE 間の約40%の知識重複を活用した効率的学習
- **模擬試験** - 各資格の本番形式に準拠した問題生成
- **ゲーミフィケーション** - XP・レベル・バッジ・デイリーミッションで学習継続を促進

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
                    │ Claude      │
                    └─────────────┘
```

| レイヤー | 技術スタック |
|----------|-------------|
| Frontend | Next.js 15, App Router, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, async, Pydantic v2 |
| Database | PostgreSQL 16 + pgvector (Azure Flexible Server / Docker) |
| SRS | py-fsrs v6 (FSRS algorithm) |
| LLM | Azure AI Foundry (GPT-5-mini, GPT-5-nano, GPT-5.2-chat) |
| CI/CD | GitHub Actions → ACR → Azure Container Apps |

## クイックスタート

### 前提条件

- Docker / Docker Compose
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
uvicorn src.main:app --reload --port 8000

# Frontend
cd apps/web
npm install
npm run dev
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
| [API リファレンス](docs/api.md) | 全エンドポイント仕様 |
| [アーキテクチャ](docs/architecture.md) | DB スキーマ・システム設計 |
| [デプロイガイド](docs/deployment.md) | Azure 環境構築手順 |
| [CLAUDE.md](CLAUDE.md) | AI アシスタント向けプロジェクト指示 |

## 対応資格

| 資格 | カラー | 概要 |
|------|--------|------|
| **CIA** (公認内部監査人) | ![#e94560](https://placehold.co/15x15/e94560/e94560.png) `#e94560` | IIA 主催、3パート構成 |
| **CISA** (公認情報システム監査人) | ![#0891b2](https://placehold.co/15x15/0891b2/0891b2.png) `#0891b2` | ISACA 主催、5ドメイン |
| **CFE** (公認不正検査士) | ![#7c3aed](https://placehold.co/15x15/7c3aed/7c3aed.png) `#7c3aed` | ACFE 主催、4セクション |

## ライセンス

Private
