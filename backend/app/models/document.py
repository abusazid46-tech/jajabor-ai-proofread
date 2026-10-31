import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Enum
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # docx, pdf, txt
    file_size = Column(Integer, nullable=False)
    language = Column(String(50), default="as")  # 'as' (Assamese), 'en' (English), 'hi' (Hindi), 'bn' (Bengali)
    status = Column(
        String(50),
        default="uploaded",
        nullable=False
    )  # uploaded, extracting, ready, analysing, awaiting_review, reviewed, exported, failed
    error_message = Column(Text, nullable=True)
    original_text = Column(Text, nullable=True)
    reviewed_text = Column(Text, nullable=True)
    
    # Metadata
    department = Column(String(255), nullable=True, default="Assam Information, Printing & Stationery Department")
    document_type = Column(String(100), nullable=True, default="Notification")
    is_sample = Column(Integer, default=0)  # 1 if seeded demonstration document
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
