import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from app.core.database import Base

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    # actions: document_uploaded, text_extracted, analysis_started, analysis_completed,
    # finding_accepted, finding_rejected, suggestion_edited, review_completed, export_generated, terminology_updated
    actor = Column(String(100), default="Proofreader (Demo Role)")
    finding_id = Column(String(36), nullable=True)
    details = Column(Text, nullable=True)  # JSON or summary text
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
