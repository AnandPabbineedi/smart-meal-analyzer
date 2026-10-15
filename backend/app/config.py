"""Application configuration settings."""

from functools import lru_cache
import json
from typing import List, Union
from pydantic import Field, field_validator
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
    allowed_origins: Union[str, List[str]] = Field(
        default=[
            "http://localhost:5173",
            "https://smartmealanalyser.netlify.app",
            "https://meal.anandpabbineedi.site",
        ],
        alias="ALLOWED_ORIGINS",
    )

    @field_validator("allowed_origins")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str], None]) -> List[str]:
        defaults = [
            "http://localhost:5173",
            "https://smartmealanalyser.netlify.app",
            "https://meal.anandpabbineedi.site",
        ]
        if v is None:
            return defaults
        if isinstance(v, str):
            val = v.strip()
            if not val:
                return defaults
            if val.startswith("[") and val.endswith("]"):
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return list(dict.fromkeys(defaults + [str(x) for x in parsed]))
                except Exception:
                    pass
            origins = [x.strip() for x in val.split(",") if x.strip()]
            return list(dict.fromkeys(defaults + origins))
        if isinstance(v, list):
            return list(dict.fromkeys(defaults + [str(x) for x in v]))
        return defaults

    @property
    def api_key(self) -> str:
        """Resolves the active Gemini API key from supported variable names."""
        return self.gemini_api_key or self.react_app_gemini_api_key


@lru_cache
def get_settings() -> Settings:
    """Singleton getter for application settings."""
    return Settings()
