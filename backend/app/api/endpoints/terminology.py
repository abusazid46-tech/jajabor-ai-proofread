from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.terminology import Terminology
from app.models.audit import AuditEvent
from app.schemas.schemas import TerminologyResponse, TerminologyCreate, TerminologyUpdate

router = APIRouter()

@router.get("/terminology", response_model=List[TerminologyResponse], tags=["Terminology"])
def list_terminology(
    language: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Terminology)
    if language:
        query = query.filter(Terminology.language == language)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Terminology.approved_term.ilike(search_pattern)) |
            (Terminology.disallowed_variants.ilike(search_pattern)) |
            (Terminology.category.ilike(search_pattern))
        )
    return query.order_by(Terminology.approved_term.asc()).all()

@router.post("/terminology", response_model=TerminologyResponse, status_code=201, tags=["Terminology"])
def create_terminology(
    entry: TerminologyCreate,
    db: Session = Depends(get_db)
):
    # Check for existing term
    existing = db.query(Terminology).filter(
        Terminology.approved_term == entry.approved_term,
        Terminology.language == entry.language
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Term '{entry.approved_term}' already exists for language '{entry.language}'.")

    new_term = Terminology(
        approved_term=entry.approved_term.strip(),
        disallowed_variants=entry.disallowed_variants.strip(),
        language=entry.language,
        category=entry.category,
        explanation=entry.explanation,
        is_sample=0
    )
    db.add(new_term)
    db.commit()
    db.refresh(new_term)

    # Audit event
    db.add(AuditEvent(
        action="terminology_added",
        actor="Administrator (Demo Role)",
        details=f"Added terminology rule: '{new_term.approved_term}' (Variants: {new_term.disallowed_variants})"
    ))
    db.commit()

    return new_term

@router.patch("/terminology/{id}", response_model=TerminologyResponse, tags=["Terminology"])
def update_terminology(
    id: str,
    update_data: TerminologyUpdate,
    db: Session = Depends(get_db)
):
    term = db.query(Terminology).filter(Terminology.id == id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Terminology entry not found")

    if update_data.approved_term is not None:
        term.approved_term = update_data.approved_term.strip()
    if update_data.disallowed_variants is not None:
        term.disallowed_variants = update_data.disallowed_variants.strip()
    if update_data.language is not None:
        term.language = update_data.language
    if update_data.category is not None:
        term.category = update_data.category
    if update_data.explanation is not None:
        term.explanation = update_data.explanation

    db.add(AuditEvent(
        action="terminology_updated",
        actor="Administrator (Demo Role)",
        details=f"Updated terminology rule for '{term.approved_term}'."
    ))
    db.commit()
    db.refresh(term)
    return term

@router.delete("/terminology/{id}", tags=["Terminology"])
def delete_terminology(id: str, db: Session = Depends(get_db)):
    term = db.query(Terminology).filter(Terminology.id == id).first()
    if not term:
        raise HTTPException(status_code=404, detail="Terminology entry not found")

    term_name = term.approved_term
    db.delete(term)
    db.add(AuditEvent(
        action="terminology_deleted",
        actor="Administrator (Demo Role)",
        details=f"Deleted terminology rule for '{term_name}'."
    ))
    db.commit()
    return {"status": "success", "message": f"Terminology entry '{term_name}' deleted."}
