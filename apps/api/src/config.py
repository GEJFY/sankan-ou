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

    # Azure OpenAI
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_api_version: str = "2024-12-01-preview"

    # CORS
    cors_origins: list[str] = ["http://localhost:3001"]

    model_config = {
        "env_file": str(_ENV_FILE) if _ENV_FILE.exists() else ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
