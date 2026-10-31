from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any

# Document Schemas
class DocumentBase(BaseModel):
    language: str = "as"
    department: Optional[str] = "Assam Information, Printing & Stationery Department"
    document_type: Optional[str] = "Notification"

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    error_message: Optional[str] = None
    original_text: Optional[str] = None
    reviewed_text: Optional[str] = None
    is_sample: int = 0
    created_at: datetime
    updated_at: datetime
    findings_count: Optional[int] = 0
    pending_count: Optional[int] = 0

# Finding Schemas
class FindingBase(BaseModel):
    category: str
    original_text: str
    suggested_correction: Optional[str] = None
    user_edited_correction: Optional[str] = None
    context: Optional[str] = None
    explanation: str
    severity: str = "medium"
    start_pos: Optional[int] = None
    end_pos: Optional[int] = None
    detection_method: str = "deterministic_rule"
    confidence: Optional[float] = None
    review_status: str = "pending"

class FindingUpdate(BaseModel):
    review_status: str = Field(..., description="'accepted', 'rejected', or 'edited'")
    user_edited_correction: Optional[str] = None

class FindingResponse(FindingBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    language: str
    created_at: datetime
    updated_at: datetime

# Review Action Schema
class ReviewActionRequest(BaseModel):
    action: str = Field(..., description="'complete_review' or 'bulk_accept'")
    note: Optional[str] = None

# Terminology Schemas
class TerminologyBase(BaseModel):
    approved_term: str
    disallowed_variants: str
    language: str = "as"
    category: str = "Administrative"
    explanation: Optional[str] = None

class TerminologyCreate(TerminologyBase):
    pass

class TerminologyUpdate(BaseModel):
    approved_term: Optional[str] = None
    disallowed_variants: Optional[str] = None
    language: Optional[str] = None
    category: Optional[str] = None
    explanation: Optional[str] = None

class TerminologyResponse(TerminologyBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    is_sample: int = 0
    created_at: datetime
    updated_at: datetime

# Audit Event Schema
class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: Optional[str] = None
    action: str
    actor: str
    finding_id: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

# Summary / Reports Schema
class ReportsSummary(BaseModel):
    total_documents: int
    awaiting_review: int
    reviewed_documents: int
    total_findings: int
    pending_findings: int
    accepted_findings: int
    rejected_findings: int
    edited_findings: int
    findings_by_category: Dict[str, int]
    findings_by_language: Dict[str, int]
    documents_by_status: Dict[str, int]
    recent_activity: List[Dict[str, Any]]
