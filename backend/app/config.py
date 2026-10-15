"""Application configuration settings."""

from functools import lru_cache
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration loaded from environment variables and defaults."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Smart Meal Analyzer API"
    app_version: str = "2.0.0"
    debug: bool = False
    port: int = Field(default=5000, alias="PORT")

    # Google Gemini API Keys (supports GEMINI_API_KEY or REACT_APP_GEMINI_API_KEY)
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    react_app_gemini_api_key: str = Field(default="", alias="REACT_APP_GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.5-flash-lite", alias="GEMINI_MODEL")

    # Rate Limiting
    hourly_limit_per_ip: int = Field(default=15, alias="HOURLY_LIMIT_PER_IP")
    daily_limit: int = Field(default=300, alias="DAILY_LIMIT")

    # Allowed CORS Origins
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "https://smartmealanalyser.netlify.app",
        "https://meal.anandpabbineedi.site",
    ]

    @property
    def api_key(self) -> str:
        """Resolves the active Gemini API key from supported variable names."""
        return self.gemini_api_key or self.react_app_gemini_api_key


@lru_cache
def get_settings() -> Settings:
    """Singleton getter for application settings."""
    return Settings()
