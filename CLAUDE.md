# GRC Triple Crown (三冠王) - Project Instructions

## Overview
AI駆動型 CIA/CISA/CFE 3資格同時学習プラットフォーム

## Architecture
- **Backend**: `apps/api/` - FastAPI (Python 3.11, async, Pydantic v2)
- **Frontend**: `apps/web/` - Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Database**: PostgreSQL 16 + pgvector (Docker)
- **SRS**: py-fsrs v6 (FSRS algorithm)
- **LLM**: Azure OpenAI (GPT-4.1-mini for generation, GPT-4.1-nano for chat)

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
- **SSE Streaming**: AI TutorのレスポンスはSSE形式

## File Structure
- `src/models/` - SQLAlchemy ORM models (Base in base.py)
- `src/schemas/` - Pydantic request/response schemas
- `src/api/v1/` - FastAPI route handlers
- `src/services/` - Business logic (FSRS, auth)
- `src/llm/` - Azure OpenAI client + prompt templates
- `seed/` - DB seed data + syllabus JSON

## Testing
- `pytest` with `asyncio_mode = "auto"`
- Markers: `@pytest.mark.unit`, `@pytest.mark.integration`
