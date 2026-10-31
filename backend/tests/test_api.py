import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # ensure models registered in Base
from app.main import app
from app.core.database import Base, get_db
from app.proofreading.engine import ProofreadingEngine
from app.models.document import Document
from app.models.finding import Finding
from app.models.terminology import Terminology
from app.models.audit import AuditEvent

# In-memory test database with StaticPool so all connections share the same memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "Assamese" in data["supported_languages"]["as"]

def test_upload_invalid_file_extension():
    files = {"file": ("malicious.exe", b"MZ...", "application/octet-stream")}
    res = client.post("/api/documents", files=files, data={"language": "as"})
    assert res.status_code == 400
    assert "Unsupported format" in res.json()["detail"]

def test_upload_and_extract_txt():
    content = "অসম চৰকাৰ। এইটো এটা পৰীক্ষামূলক জাননী।"
    files = {"file": ("test_notice.txt", content.encode("utf-8"), "text/plain")}
    res = client.post("/api/documents", files=files, data={"language": "as", "department": "Test Dept"})
    assert res.status_code == 201
    data = res.json()
    assert data["original_filename"] == "test_notice.txt"
    assert data["status"] == "ready"
    assert content in data["original_text"]

@pytest.mark.asyncio
async def test_rule_based_proofreading_assamese():
    db = TestingSessionLocal()
    # Insert terminology rule
    term = Terminology(
        approved_term="কাৰ্যালয়",
        disallowed_variants="কাৰ্য্যালয়",
        language="as",
        category="Orthography"
    )
    db.add(term)
    db.commit()

    test_text = "সকলো চৰকাৰী কাৰ্য্যালয়ৰ আদেশ আদেশ অনুসৰি কাম হ'ব।প্ৰতিবেদন জমা দিয়ক  ।"
    findings = await ProofreadingEngine.analyze_document(test_text, language="as", db=db)
    
    categories = [f["category"] for f in findings]
    assert "repeated_words" in categories  # 'আদেশ আদেশ'
    assert "punctuation" in categories     # 'হ'ব।প্ৰতিবেদন'
    assert "whitespace" in categories      # '  ।'

    db.close()

@pytest.mark.asyncio
async def test_empty_findings_when_text_is_clean():
    clean_text = "এই নিৰ্দেশনা তাৎক্ষণিকভাৱে কাৰ্যকৰী হ'ব। ৰাজ্যৰ সকলো জিলা উপায়ুক্তলৈ ইয়াৰ প্ৰতিলিপি প্ৰেৰণ কৰা হ'ল।"
    findings = await ProofreadingEngine.analyze_document(clean_text, language="as")
    assert len(findings) == 0

def test_finding_lifecycle_and_audit():
    # 1. Upload
    content = "This is the the circular."
    files = {"file": ("eng.txt", content.encode("utf-8"), "text/plain")}
    res_up = client.post("/api/documents", files=files, data={"language": "en"})
    assert res_up.status_code == 201
    doc_id = res_up.json()["id"]

    # 2. Analyse
    res_an = client.post(f"/api/documents/{doc_id}/analyse")
    assert res_an.status_code == 200
    
    # 3. Get findings
    res_f = client.get(f"/api/documents/{doc_id}/findings")
    findings = res_f.json()
    assert len(findings) >= 1
    finding_id = findings[0]["id"]

    # 4. Accept finding
    res_patch = client.patch(f"/api/findings/{finding_id}", json={"review_status": "accepted"})
    assert res_patch.status_code == 200
    assert res_patch.json()["review_status"] == "accepted"

    # 5. Check updated document reviewed text
    res_doc = client.get(f"/api/documents/{doc_id}")
    assert "the circular" in res_doc.json()["reviewed_text"]
    assert "the the" not in res_doc.json()["reviewed_text"]

    # 6. Check Audit Trail
    res_hist = client.get(f"/api/documents/{doc_id}/history")
    actions = [ev["action"] for ev in res_hist.json()]
    assert "document_uploaded" in actions
    assert "analysis_started" in actions
    assert "finding_accepted" in actions

def test_export_endpoints():
    content = "General notification text."
    files = {"file": ("report_doc.txt", content.encode("utf-8"), "text/plain")}
    res_up = client.post("/api/documents", files=files, data={"language": "en"})
    assert res_up.status_code == 201
    doc_id = res_up.json()["id"]

    # CSV Export
    res_csv = client.get(f"/api/documents/{doc_id}/export?format=csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Finding ID,Document Name" in res_csv.text

    # HTML Export
    res_html = client.get(f"/api/documents/{doc_id}/export?format=html")
    assert res_html.status_code == 200
    assert "text/html" in res_html.headers["content-type"]
    assert "Jajabor AI Proofread" in res_html.text

    # DOCX Export
    res_docx = client.get(f"/api/documents/{doc_id}/export?format=docx")
    assert res_docx.status_code == 200
    assert "application/vnd.openxmlformats" in res_docx.headers["content-type"]

def test_terminology_crud():
    # Create
    entry_data = {
        "approved_term": "সঞ্চালকালয়",
        "disallowed_variants": "সঞ্চালকালয়, ডাইৰেক্টৰেট",
        "language": "as",
        "category": "Administrative Terms",
        "explanation": "Standard Assamese term for Directorate."
    }
    res_create = client.post("/api/terminology", json=entry_data)
    assert res_create.status_code == 201
    term_id = res_create.json()["id"]

    # List & Search
    res_list = client.get("/api/terminology?search=সঞ্চালকালয়")
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    # Update
    res_update = client.patch(f"/api/terminology/{term_id}", json={"category": "State Departments"})
    assert res_update.status_code == 200
    assert res_update.json()["category"] == "State Departments"

    # Delete
    res_del = client.delete(f"/api/terminology/{term_id}")
    assert res_del.status_code == 200
