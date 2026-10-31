from fastapi import APIRouter
from app.api.endpoints import health, documents, findings, terminology, reports, audit

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(documents.router)
api_router.include_router(findings.router)
api_router.include_router(terminology.router)
api_router.include_router(reports.router)
api_router.include_router(audit.router)
