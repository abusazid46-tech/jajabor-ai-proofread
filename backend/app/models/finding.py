import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Float, ForeignKey
from app.core.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    language = Column(String(50), nullable=False)
    
    # Categories: spelling, grammar, punctuation, repeated_words, whitespace, terminology, number_date, ocr_uncertainty
    category = Column(String(50), nullable=False, index=True)
    
    original_text = Column(Text, nullable=False)
    suggested_correction = Column(Text, nullable=True)
    user_edited_correction = Column(Text, nullable=True)
    context = Column(Text, nullable=True)
    explanation = Column(Text, nullable=False)
    
    # Severity: high, medium, low
    severity = Column(String(20), default="medium")
    
    # Character indices or location references in extracted text
    start_pos = Column(Integer, nullable=True)
    end_pos = Column(Integer, nullable=True)
    
    # Detection method: deterministic_rule, terminology_check, ai_assisted
    detection_method = Column(String(50), default="deterministic_rule")
    confidence = Column(Float, nullable=True)  # Only provided when method supports it
    
    # Review status: pending, accepted, rejected, edited
    review_status = Column(String(30), default="pending", index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
