import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.models.document import Document
from app.models.finding import Finding
from app.models.audit import AuditEvent
from app.schemas.schemas import DocumentResponse, FindingResponse, ReviewActionRequest
from app.document_processing.extractor import DocumentExtractor, ExtractionError
from app.document_processing.exporter import DocumentExporter
from app.proofreading.engine import ProofreadingEngine

router = APIRouter()

@router.get("/documents", response_model=List[DocumentResponse], tags=["Documents"])
def list_documents(
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    language: Optional[str] = Query(None)
):
    query = db.query(Document)
    if status:
        query = query.filter(Document.status == status)
    if language:
        query = query.filter(Document.language == language)
    
    docs = query.order_by(Document.created_at.desc()).all()
    results = []
    for d in docs:
        total_f = db.query(Finding).filter(Finding.document_id == d.id).count()
        pending_f = db.query(Finding).filter(Finding.document_id == d.id, Finding.review_status == "pending").count()
        doc_dict = {c.name: getattr(d, c.name) for c in d.__table__.columns}
        doc_dict["findings_count"] = total_f
        doc_dict["pending_count"] = pending_f
        results.append(doc_dict)
    return results

@router.post("/documents", response_model=DocumentResponse, status_code=201, tags=["Documents"])
async def upload_document(
    file: UploadFile = File(...),
    language: str = Form("as"),
    department: str = Form("Assam Information, Printing & Stationery Department"),
    document_type: str = Form("Notification"),
    db: Session = Depends(get_db)
):
    orig_name = file.filename or "uploaded_document"
    ext = Path(orig_name).suffix.lower()
    
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    try:
        safe_name, storage_path = DocumentExtractor.get_safe_storage_path(orig_name)
        
        # Save file to upload directory safely
        contents = await file.read()
        if len(contents) > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
            )

        with open(storage_path, "wb") as f:
            f.write(contents)

        # Create database record
        doc = Document(
            original_filename=orig_name,
            storage_path=storage_path,
            file_type=ext.replace(".", ""),
            file_size=len(contents),
            language=language,
            status="extracting",
            department=department,
            document_type=document_type
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        # Audit event: Upload
        audit_up = AuditEvent(
            document_id=doc.id,
            action="document_uploaded",
            actor="Proofreader (Demo Role)",
            details=f"Uploaded file '{orig_name}' ({len(contents)} bytes) for {language.upper()} proofreading."
        )
        db.add(audit_up)

        # Extract text immediately
        try:
            extracted_text, meta = DocumentExtractor.extract_text(storage_path, ext)
            doc.original_text = extracted_text
            doc.reviewed_text = extracted_text
            doc.status = "ready"
            
            audit_ext = AuditEvent(
                document_id=doc.id,
                action="text_extracted",
                actor="System Pipeline",
                details=f"Extracted {meta.get('char_count', 0)} characters ({meta.get('paragraph_count', 1)} paragraphs)."
            )
            db.add(audit_ext)

        except ExtractionError as ee:
            doc.status = "failed"
            doc.error_message = str(ee)
            audit_err = AuditEvent(
                document_id=doc.id,
                action="extraction_failed",
                actor="System Pipeline",
                details=f"Extraction error: {str(ee)}"
            )
            db.add(audit_err)

        db.commit()
        db.refresh(doc)

        doc_dict = {c.name: getattr(doc, c.name) for c in doc.__table__.columns}
        doc_dict["findings_count"] = 0
        doc_dict["pending_count"] = 0
        return doc_dict

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document upload: {str(e)}")

@router.get("/documents/{id}", response_model=DocumentResponse, tags=["Documents"])
def get_document(id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    total_f = db.query(Finding).filter(Finding.document_id == doc.id).count()
    pending_f = db.query(Finding).filter(Finding.document_id == doc.id, Finding.review_status == "pending").count()
    doc_dict = {c.name: getattr(doc, c.name) for c in doc.__table__.columns}
    doc_dict["findings_count"] = total_f
    doc_dict["pending_count"] = pending_f
    return doc_dict

@router.get("/documents/{id}/text", tags=["Documents"])
def get_document_text(id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "original_text": doc.original_text or "",
        "reviewed_text": doc.reviewed_text or "",
        "status": doc.status,
        "language": doc.language
    }

@router.post("/documents/{id}/analyse", tags=["Proofreading"])
async def analyse_document(
    id: str,
    use_ai: bool = Query(False),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not doc.original_text:
        raise HTTPException(status_code=400, detail="Document contains no extracted text to proofread.")

    doc.status = "analysing"
    db.commit()

    # Log audit event
    db.add(AuditEvent(
        document_id=doc.id,
        action="analysis_started",
        actor="Proofreader (Demo Role)",
        details=f"Triggered analysis (Language: {doc.language}, AI-Assisted: {use_ai})"
    ))
    db.commit()

    # Clear previous findings for this document to avoid duplicate accumulation on re-run
    db.query(Finding).filter(Finding.document_id == doc.id).delete()
    db.commit()

    findings_data = await ProofreadingEngine.analyze_document(
        text=doc.original_text,
        language=doc.language,
        db=db,
        use_ai=use_ai
    )

    created_findings = []
    for fd in findings_data:
        f = Finding(
            document_id=doc.id,
            language=doc.language,
            category=fd["category"],
            original_text=fd["original_text"],
            suggested_correction=fd.get("suggested_correction"),
            context=fd.get("context"),
            explanation=fd["explanation"],
            severity=fd.get("severity", "medium"),
            start_pos=fd.get("start_pos"),
            end_pos=fd.get("end_pos"),
            detection_method=fd.get("detection_method", "deterministic_rule"),
            confidence=fd.get("confidence"),
            review_status="pending"
        )
        db.add(f)
        created_findings.append(f)

    doc.status = "awaiting_review"
    # Reset reviewed_text to original so decisions can be applied
    doc.reviewed_text = doc.original_text
    
    db.add(AuditEvent(
        document_id=doc.id,
        action="analysis_completed",
        actor="Proofreading Engine",
        details=f"Analysis completed: {len(created_findings)} potential findings detected."
    ))
    db.commit()

    return {
        "status": "success",
        "document_id": doc.id,
        "findings_count": len(created_findings),
        "document_status": doc.status
    }

@router.get("/documents/{id}/findings", response_model=List[FindingResponse], tags=["Proofreading"])
def get_document_findings(
    id: str,
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Finding).filter(Finding.document_id == id)
    if category:
        query = query.filter(Finding.category == category)
    if status:
        query = query.filter(Finding.review_status == status)
    if severity:
        query = query.filter(Finding.severity == severity)
        
    return query.order_by(Finding.start_pos.asc()).all()

@router.post("/documents/{id}/review", tags=["Review Workspace"])
def update_document_review_status(
    id: str,
    req: ReviewActionRequest,
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if req.action == "complete_review":
        doc.status = "reviewed"
        db.add(AuditEvent(
            document_id=doc.id,
            action="review_completed",
            actor="Reviewer / Approver",
            details=f"Review marked completed. {req.note or ''}"
        ))
    elif req.action == "bulk_accept":
        # Bulk accept remaining pending findings
        pending = db.query(Finding).filter(Finding.document_id == doc.id, Finding.review_status == "pending").all()
        for p in pending:
            p.review_status = "accepted"
        
        # Rebuild reviewed text
        _rebuild_reviewed_text(doc, db)
        
        db.add(AuditEvent(
            document_id=doc.id,
            action="bulk_accepted",
            actor="Reviewer (Convenience Action)",
            details=f"Bulk-accepted {len(pending)} pending findings with explicit reviewer confirmation."
        ))

    db.commit()
    return {"status": "success", "document_status": doc.status}

def _rebuild_reviewed_text(doc: Document, db: Session):
    """
    Reconstructs reviewed_text from original_text by applying all accepted and edited findings in order.
    Original file remains untouched.
    """
    findings = db.query(Finding).filter(
        Finding.document_id == doc.id,
        Finding.review_status.in_(["accepted", "edited"])
    ).order_by(Finding.start_pos.desc()).all()

    text = doc.original_text or ""
    # Apply replacements from end to start to preserve indices
    for f in findings:
        if f.start_pos is not None and f.end_pos is not None and f.start_pos < len(text):
            replacement = f.user_edited_correction if f.review_status == "edited" else f.suggested_correction
            if replacement is not None and text[f.start_pos:f.end_pos] == f.original_text:
                text = text[:f.start_pos] + replacement + text[f.end_pos:]

    doc.reviewed_text = text

@router.get("/documents/{id}/history", tags=["Audit"])
def get_document_history(id: str, db: Session = Depends(get_db)):
    events = db.query(AuditEvent).filter(AuditEvent.document_id == id).order_by(AuditEvent.timestamp.desc()).all()
    return events

@router.get("/documents/{id}/export", tags=["Export"])
def export_document(
    id: str,
    format: str = Query("csv", description="csv, html, or docx"),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    findings = db.query(Finding).filter(Finding.document_id == doc.id).order_by(Finding.start_pos.asc()).all()
    doc_dict = {c.name: getattr(doc, c.name) for c in doc.__table__.columns}
    findings_list = [{c.name: getattr(f, c.name) for c in f.__table__.columns} for f in findings]

    fmt = format.lower()
    
    # Audit event
    db.add(AuditEvent(
        document_id=doc.id,
        action="export_generated",
        actor="Proofreader / Exporter",
        details=f"Exported {fmt.upper()} report ({len(findings)} findings)."
    ))
    db.commit()

    if fmt == "csv":
        csv_content = DocumentExporter.generate_csv_report(doc_dict, findings_list)
        filename = f"proofread_report_{Path(doc.original_filename).stem}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    elif fmt == "html":
        html_content = DocumentExporter.generate_html_report(doc_dict, findings_list)
        filename = f"proofread_report_{Path(doc.original_filename).stem}.html"
        return Response(
            content=html_content,
            media_type="text/html",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    elif fmt == "docx":
        # Generate new reviewed DOCX without touching original
        out_docx_path = DocumentExporter.generate_reviewed_docx(doc_dict, doc.reviewed_text or doc.original_text or "")
        filename = Path(out_docx_path).name
        return FileResponse(
            path=out_docx_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=filename
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format. Use 'csv', 'html', or 'docx'.")
