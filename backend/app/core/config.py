from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str

    # Auth & JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Gemini
    GEMINI_API_KEY: str = ""

    # App environment
    ENVIRONMENT: str = "development"
    COOKIE_SECURE: bool = False  # True in production HTTPS
    COOKIE_SAMESITE: str = "lax"


@lru_cache
def get_settings() -> Settings:
    return Settings()
