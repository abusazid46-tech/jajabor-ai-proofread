import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Jajabor AI Proofread"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Storage & Upload limits
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    EXPORT_DIR: str = str(BASE_DIR / "exports")
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_EXTENSIONS: set[str] = {".docx", ".pdf", ".txt"}
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/jajabor.db"
    
    # Optional AI Provider Configuration
    AI_PROVIDER: str = "none"  # "none", "gemini", "openai"
    AI_API_KEY: str | None = None
    AI_TIMEOUT_SECONDS: int = 15
    AI_MAX_CHARS_PER_REQUEST: int = 4000
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()

# Ensure directories exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.EXPORT_DIR).mkdir(parents=True, exist_ok=True)
