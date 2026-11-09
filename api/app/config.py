import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "PulseForge"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./pulseforge.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "pulseforge-super-secret-jwt-key-2026-hackathon-velocity")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"

    @property
    def async_database_url(self) -> str:
        url = (self.DATABASE_URL or "").strip()
        if not url:
            url = "sqlite+aiosqlite:///./pulseforge.db"
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # asyncpg does not support sslmode=require and channel_binding=require query parameters in SQLAlchemy URLs
        if "sslmode=require" in url:
            url = url.replace("sslmode=require", "ssl=require")
        if "&channel_binding=require" in url:
            url = url.replace("&channel_binding=require", "")
        elif "?channel_binding=require" in url:
            url = url.replace("?channel_binding=require", "")
        return url

settings = Settings()
