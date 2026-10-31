from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.audit import AuditEvent
from app.schemas.schemas import AuditEventResponse

router = APIRouter()

@router.get("/audit", response_model=List[AuditEventResponse], tags=["Audit"])
def list_audit_events(
    document_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if document_id:
        query = query.filter(AuditEvent.document_id == document_id)
    if action:
        query = query.filter(AuditEvent.action == action)

    return query.order_by(AuditEvent.timestamp.desc()).limit(limit).all()
