from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.document import Document
from app.models.finding import Finding
from app.models.audit import AuditEvent
from app.schemas.schemas import FindingResponse, FindingUpdate
from app.api.endpoints.documents import _rebuild_reviewed_text

router = APIRouter()

@router.patch("/findings/{id}", response_model=FindingResponse, tags=["Findings"])
def update_finding_status(
    id: str,
    update_data: FindingUpdate,
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    new_status = update_data.review_status.lower()
    if new_status not in ["accepted", "rejected", "edited", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'accepted', 'rejected', 'edited', or 'pending'.")

    finding.review_status = new_status
    if update_data.user_edited_correction is not None:
        finding.user_edited_correction = update_data.user_edited_correction

    # Audit event mapping
    action_map = {
        "accepted": "finding_accepted",
        "rejected": "finding_rejected",
        "edited": "suggestion_edited",
        "pending": "finding_reset"
    }
    
    details_str = f"Status set to {new_status.upper()}."
    if new_status == "edited":
        details_str += f" Custom correction: '{finding.user_edited_correction}'."
    elif new_status == "accepted":
        details_str += f" Accepted suggestion: '{finding.suggested_correction}'."
    elif new_status == "rejected":
        details_str += f" Kept original text: '{finding.original_text}'."

    audit_ev = AuditEvent(
        document_id=finding.document_id,
        finding_id=finding.id,
        action=action_map.get(new_status, "finding_updated"),
        actor="Proofreader / Reviewer",
        details=details_str
    )
    db.add(audit_ev)
    db.flush()

    # Rebuild reviewed text for parent document
    doc = db.query(Document).filter(Document.id == finding.document_id).first()
    if doc:
        _rebuild_reviewed_text(doc, db)

    db.commit()
    db.refresh(finding)
    return finding
