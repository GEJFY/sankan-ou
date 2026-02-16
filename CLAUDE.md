# GRC Triple Crown (三冠王) - Project Instructions

## Overview
AI駆動型 CIA/CISA/CFE 3資格同時学習プラットフォーム

## Architecture
- **Backend**: `apps/api/` - FastAPI (Python 3.11, async, Pydantic v2)
- **Frontend**: `apps/web/` - Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Database**: PostgreSQL 16 + pgvector (Azure Flexible Server / Docker)
- **SRS**: py-fsrs v6 (FSRS algorithm)
- **LLM**: Azure AI Foundry (マルチプロバイダー: OpenAI + Anthropic)
  - GPT-5系: GPT-5-mini (生成), GPT-5-nano (チャット), GPT-5.2-chat (フラグシップ)
  - Anthropic系: Claude Opus 4.6, Claude Haiku 4.5 (Enterprise/MCA-Eサブスクリプション要)
  - 環境変数 `LLM_MODEL_GENERATION` / `LLM_MODEL_CHAT` で切替可能
- **CI/CD**: GitHub Actions (CI: テスト+ビルド, CD: ACRビルド→Container Appデプロイ)

## GPT-5 Reasoning Model 注意事項
- `max_tokens` ではなく `max_completion_tokens` を使用
- `temperature` は 1 のみサポート（省略推奨）
- reasoning tokens が completion tokens に含まれるため、max_completion_tokens は大きめに設定（デフォルト: 16384）

## Azure Infrastructure
- **Resource Group**: `rg-sankanou` (Japan East)
- **AI Services**: `sankanou-ai` (East US 2, kind: AIServices)
- **Container Apps**: `sankanou-api` / `sankanou-web` (Japan East)
- **ACR**: `sankanouacr.azurecr.io`
- **PostgreSQL**: `sankanou-db.postgres.database.azure.com` (Flexible Server, v16)
- **API URL**: `https://sankanou-api.delightfulbush-953bf077.japaneast.azurecontainerapps.io`

## Development Commands
```bash
# Docker環境起動
docker compose up -d

# Backend (apps/api/)
cd apps/api
pip install -e ".[dev]"
uvicorn src.main:app --reload --port 8000
python -m pytest tests/ -v

# DB seed
python -m seed.seed_db

# Frontend (apps/web/)
cd apps/web
npm install
npm run dev

# Alembic migration
cd apps/api
alembic upgrade head
alembic revision --autogenerate -m "description"
```

## Key Patterns
- **Demo User ID**: `00000000-0000-0000-0000-000000000001` (MVP用、Phase 3でJWT認証に差替)
- **FSRS Rating**: 1=Again, 2=Hard, 3=Good, 4=Easy
- **Course Colors**: CIA=#e94560, CISA=#0891b2, CFE=#7c3aed
- **API Prefix**: `/api/v1/`
- **SSE Streaming**: AI TutorのレスポンスはSSE形式（エラー時は `{"error": "..."}` を返す）

## File Structure
- `src/models/` - SQLAlchemy ORM models (Base in base.py)
- `src/schemas/` - Pydantic request/response schemas
- `src/api/v1/` - FastAPI route handlers
- `src/services/` - Business logic (FSRS, auth)
- `src/llm/` - Azure AI Foundry client (OpenAI/Anthropic自動ルーティング) + prompt templates
- `seed/` - DB seed data + syllabus JSON

## Testing
- `pytest` with `asyncio_mode = "auto"`
- Markers: `@pytest.mark.unit`, `@pytest.mark.integration`
