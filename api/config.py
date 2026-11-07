import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(os.path.join(BASE_DIR, ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=("settings_",)
    )

    google_api_key: Optional[str] = None
    model_name: str = "gemini-2.5-flash-lite"
    database_url: str = "sqlite:///./sql_app.db"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
