"""アプリケーション設定 - pydantic-settings"""

from pathlib import Path

from pydantic_settings import BaseSettings

# プロジェクトルートの.envを探す (apps/api/ → sankan-ou/)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://sankanou:sankanou_dev@localhost:5433/sankanou"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    debug: bool = False

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    # Azure AI Foundry (統一エンドポイント)
    azure_foundry_endpoint: str = ""
    azure_foundry_api_key: str = ""
    azure_foundry_api_version: str = "2024-12-01-preview"

    # LLM モデル選択 (環境変数で切り替え可能)
    # GPT-5系: gpt-5.2-chat (フラグシップ), gpt-5-mini (コスパ), gpt-5-nano (低コスト)
    # Claude系: claude-opus-4-6, claude-haiku-4-5 (Enterprise/MCA-Eサブスクリプション要)
    llm_model_generation: str = "gpt-5-mini"
    llm_model_chat: str = "gpt-5-nano"

    # Google Gemini (Vertex AI 経由)
    google_gemini_api_key: str = ""  # 直接API用（空ならVertex AI ADCを使用）
    google_gemini_project: str = ""  # GCPプロジェクトID (Vertex AI用)
    google_gemini_location: str = "us-central1"  # Vertex AIリージョン
    google_gemini_model: str = "gemini-2.5-flash"  # テキスト生成用
    google_gemini_image_model: str = "gemini-2.5-flash-image"  # 画像生成用

    # CORS (dev: localhost:3000, localhost:3001)
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8003",
    ]

    model_config = {
        "env_file": str(_ENV_FILE) if _ENV_FILE.exists() else ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
