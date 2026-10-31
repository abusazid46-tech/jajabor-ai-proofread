from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()

@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_provider": settings.AI_PROVIDER,
        "supported_languages": {
            "as": "Assamese (Primary / Production-Ready Rules)",
            "en": "English (Primary / Production-Ready Rules)",
            "hi": "Hindi (Experimental / Partial Rules)",
            "bn": "Bengali (Experimental / Partial Rules)"
        }
    }
