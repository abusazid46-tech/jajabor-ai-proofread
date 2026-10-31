import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text
from app.core.database import Base

class Terminology(Base):
    __tablename__ = "terminology"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    approved_term = Column(String(255), nullable=False, index=True)
    disallowed_variants = Column(Text, nullable=False)  # Comma or newline separated variants
    language = Column(String(50), default="as", nullable=False)  # 'as', 'en', 'hi', 'bn'
    category = Column(String(100), default="Administrative", nullable=False)
    explanation = Column(Text, nullable=True)
    is_sample = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
