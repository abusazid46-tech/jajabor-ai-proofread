from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.document import Document
from app.models.finding import Finding
from app.models.audit import AuditEvent
from app.schemas.schemas import ReportsSummary

router = APIRouter()

@router.get("/reports/summary", response_model=ReportsSummary, tags=["Reports & Metrics"])
def get_reports_summary(db: Session = Depends(get_db)):
    total_docs = db.query(Document).count()
    awaiting_review = db.query(Document).filter(Document.status == "awaiting_review").count()
    reviewed_docs = db.query(Document).filter(Document.status == "reviewed").count()

    total_findings = db.query(Finding).count()
    pending_findings = db.query(Finding).filter(Finding.review_status == "pending").count()
    accepted_findings = db.query(Finding).filter(Finding.review_status == "accepted").count()
    rejected_findings = db.query(Finding).filter(Finding.review_status == "rejected").count()
    edited_findings = db.query(Finding).filter(Finding.review_status == "edited").count()

    # Category distribution
    cat_counts = db.query(Finding.category, func.count(Finding.id)).group_by(Finding.category).all()
    findings_by_category = {cat: count for cat, count in cat_counts}

    # Language distribution
    lang_counts = db.query(Document.language, func.count(Document.id)).group_by(Document.language).all()
    findings_by_language = {lang: count for lang, count in lang_counts}

    # Status distribution
    status_counts = db.query(Document.status, func.count(Document.id)).group_by(Document.status).all()
    documents_by_status = {st: count for st, count in status_counts}

    # Recent activity
    recent_events = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(10).all()
    recent_activity = [
        {
            "id": ev.id,
            "document_id": ev.document_id,
            "action": ev.action,
            "actor": ev.actor,
            "details": ev.details,
            "timestamp": ev.timestamp.isoformat()
        }
        for ev in recent_events
    ]

    return {
        "total_documents": total_docs,
        "awaiting_review": awaiting_review,
        "reviewed_documents": reviewed_docs,
        "total_findings": total_findings,
        "pending_findings": pending_findings,
        "accepted_findings": accepted_findings,
        "rejected_findings": rejected_findings,
        "edited_findings": edited_findings,
        "findings_by_category": findings_by_category,
        "findings_by_language": findings_by_language,
        "documents_by_status": documents_by_status,
        "recent_activity": recent_activity
    }
