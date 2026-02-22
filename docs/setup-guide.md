# GRC Triple Crown (三冠王) — 開発者セットアップガイド

## 前提条件

| ツール | バージョン | 用途 |
|--------|-----------|------|
| Docker Desktop | v24+ | PostgreSQL + アプリケーション実行 |
| Node.js | 20+ | フロントエンド開発 |
| Python | 3.11+ | バックエンド開発 |
| Git | 最新 | バージョン管理 |
| VS Code | 最新（推奨） | 開発エディタ |

## 1. リポジトリクローン

```bash
git clone https://github.com/GEJFY/sankan-ou.git
cd sankan-ou
```

## 2. 環境変数設定

`apps/api/.env` ファイルを作成し、以下の内容を設定する。

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/sankanou

# Authentication
JWT_SECRET=your-secret-key-here

# Azure AI Foundry (LLM)
AZURE_FOUNDRY_ENDPOINT=https://your-endpoint.services.ai.azure.com
AZURE_FOUNDRY_API_KEY=your-api-key
LLM_MODEL_GENERATION=gpt-5-mini
LLM_MODEL_CHAT=gpt-5-nano

# Optional: Google Gemini fallback
GOOGLE_GEMINI_API_KEY=
GOOGLE_GEMINI_PROJECT=
```

### 環境変数一覧

| 変数名 | 必須 | 説明 | デフォルト値 |
|--------|------|------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL 接続文字列 (asyncpg) | — |
| `JWT_SECRET` | Yes | JWT トークン署名キー | — |
| `AZURE_FOUNDRY_ENDPOINT` | Yes* | Azure AI Foundry エンドポイント | — |
| `AZURE_FOUNDRY_API_KEY` | Yes* | Azure AI Foundry API キー | — |
| `LLM_MODEL_GENERATION` | No | 問題生成・スライド生成用モデル | `gpt-5-mini` |
| `LLM_MODEL_CHAT` | No | AI Tutor チャット用モデル | `gpt-5-nano` |
| `GOOGLE_GEMINI_API_KEY` | No | Gemini フォールバック用 API キー | — |
| `GOOGLE_GEMINI_PROJECT` | No | GCP プロジェクト ID (Vertex AI) | — |

> *Azure AI 未設定の場合、AI 機能（問題生成、AI Tutor、スライド）は動作しないが、その他の機能は正常に使用できる。

## 3. Docker Compose 起動（推奨）

```bash
docker compose up -d
```

3つのサービスが起動する。

| サービス | コンテナポート | ホストポート | 説明 |
|----------|--------------|-------------|------|
| `db` | 5432 | **5433** | PostgreSQL 16 + pgvector |
| `api` | 8000 | **8003** | FastAPI バックエンド |
| `web` | 3000 | **3001** | Next.js フロントエンド |

起動後のアクセス先:
- API ドキュメント: http://localhost:8003/docs
- Web アプリ: http://localhost:3001

DB シード投入:

```bash
docker compose exec api python -m seed.seed_db
```

## 4. バックエンド個別起動

Docker を使わずにバックエンドを起動する場合:

```bash
cd apps/api

# 仮想環境作成・有効化
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 依存関係インストール
pip install -e ".[dev]"

# DB マイグレーション適用
alembic upgrade head

# シードデータ投入
python -m seed.seed_db

# 開発サーバー起動
uvicorn src.main:app --reload --port 8000
```

> API ドキュメント: http://localhost:8000/docs

## 5. フロントエンド個別起動

```bash
cd apps/web

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

> Web アプリ: http://localhost:3000

## 6. テスト実行

### バックエンド

```bash
cd apps/api

# テスト実行
python -m pytest tests/ -v

# カバレッジ付きテスト
python -m pytest tests/ --cov=src --cov-report=html
```

### フロントエンド

```bash
cd apps/web

# ビルド確認（型チェック含む）
npm run build
```

## 7. Alembic マイグレーション

```bash
cd apps/api

# マイグレーション適用
alembic upgrade head

# 新規マイグレーション作成（モデル変更後）
alembic revision --autogenerate -m "description"

# マイグレーション履歴確認
alembic history

# 1つ前に戻す
alembic downgrade -1
```

## 8. コード品質

### Python (バックエンド)

```bash
cd apps/api

# リンター
ruff check src/

# 型チェック
mypy src/
```

### TypeScript (フロントエンド)

```bash
cd apps/web

# ビルド（型チェック含む）
npm run build
```

## 9. CI/CD

GitHub Actions で以下の3ジョブが自動実行される。

| ジョブ | トリガー | 内容 |
|--------|---------|------|
| **API Tests** | PR / push to main | pytest 実行 |
| **Web Build** | PR / push to main | Next.js ビルド確認 |
| **Docker Build** | PR / push to main | Docker イメージビルド確認 |

- **CI**: PR 作成時に自動実行
- **CD**: main マージ後に ACR ビルド → Azure Container Apps デプロイ

## 10. トラブルシューティング

| 問題 | 解決策 |
|------|--------|
| ポート 5433 衝突 | `docker compose down` で停止後、再度 `docker compose up -d` |
| OneDrive 同期で venv 問題 | `.venv` を OneDrive 同期対象外のディレクトリに作成する |
| LLM 未設定で AI 機能が動かない | Azure AI の環境変数を正しく設定する。未設定でも AI 以外の機能は正常動作 |
| alembic エラー | DB 接続を確認し、`alembic upgrade head` を先に実行 |
| Windows 改行コード問題 | `git config core.autocrlf true` を設定 |
| import エラー | `pip install -e ".[dev]"` で再インストール、`__init__.py` の存在確認 |
| Docker ビルド失敗 | `docker compose build --no-cache` でキャッシュクリアビルド |
