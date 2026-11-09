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

settings = Settings()
