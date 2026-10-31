# Jajabor AI Proofread &mdash; Multilingual Government Document Proofreading & Quality Assurance Platform

**Initiative:** Jajabor AI  
**Programme:** NESFIC 2026 &mdash; Stream 1  
**Challenge ID:** NESFIC-D-38  
**Challenge:** Faster, More Consistent Multilingual Proofreading of Government Documents  
**Challenge Owner:** Assam Information, Printing & Stationery Department &mdash; Directorate of Printing & Stationery  

> [!NOTE]
> **Innovation Prototype Notice:** This software is an innovation challenge prototype designed to assist human proofreaders in government document quality assurance. It does not replace human proofreaders, and no document is represented as officially approved solely by automated processing. The platform operates 100% offline with zero paid external API dependencies using a deterministic rule-based engine.

---

## 1. System Overview

Jajabor AI Proofread addresses the critical challenge of proofreading high-volume, high-stakes official publications (notifications, gazettes, departmental reports, administrative circulars) across languages (Assamese, English, Hindi, Bengali).

### Key Highlights:
- **Human-in-the-Loop Review Console**: Interactive 3-panel workspace providing side-by-side comparison, active highlight in context, and instant Accept, Reject, and Edit controls.
- **Assamese Orthographic Fidelity**: Enforces modern standard Assamese orthography (Asam Sahitya Sabha standards, such as non-gemination after reph `ৰ্`, danda spacing, duplicate words, whitespace normalization).
- **Unicode-Aware Terminology Dictionary**: Database-driven terminology management preventing corrupt substring replacements.
- **Zero-Key Deterministic Fallback**: Operates entirely offline without requiring paid cloud API keys.
- **Immutable Document Preservation**: Original uploaded documents are stored in a secure sandbox and remain unmodified. Clean reviewed DOCX and audit reports (CSV, HTML) are generated as separate outputs.
- **Backend Audit Trail**: Every upload, extraction, analysis, accept, reject, edit, and export action is logged with actor and timestamp.

---

## 2. Directory Structure

```
jajabor-ai-proofread/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── audit.py         # Chronological audit events API
│   │   │   │   ├── documents.py     # Upload, list, text, analyse, export API
│   │   │   │   ├── findings.py      # Accept, reject, edit decisions API
│   │   │   │   ├── health.py        # System status & language matrix API
│   │   │   │   ├── reports.py       # Metrics & quality summary API
│   │   │   │   └── terminology.py   # Glossary CRUD & dictionary API
│   │   │   └── router.py            # API V1 router
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic BaseSettings & storage paths
│   │   │   └── database.py          # SQLAlchemy SQLite connection & session
│   │   ├── document_processing/
│   │   │   ├── exporter.py          # CSV, HTML, and reviewed DOCX generator
│   │   │   └── extractor.py         # DOCX, text-based PDF, and TXT extractors
│   │   ├── models/                  # SQLAlchemy ORM models (Document, Finding, etc.)
│   │   ├── proofreading/
│   │   │   ├── ai_provider.py       # Abstract AI provider + offline fallback
│   │   │   ├── engine.py            # Modular proofreading orchestrator
│   │   │   ├── rules/
│   │   │   │   ├── assamese_rules.py# Assamese danda, gemination, spelling rules
│   │   │   │   ├── common_rules.py  # Whitespace, repeated words, punctuation
│   │   │   │   └── english_rules.py # Capitalization, typo dictionary
│   │   │   └── terminology_checker.py # Unicode whole-word boundary matcher
│   │   ├── main.py                  # FastAPI application entrypoint
│   │   ├── schemas/                 # Pydantic request & response models
│   │   └── seed.py                  # Synthetic demonstration documents & rules
│   ├── tests/
│   │   └── test_api.py              # Automated test suite (8 tests)
│   ├── pytest.ini
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Overview Dashboard
│   │   │   ├── documents/page.tsx   # Document library & management
│   │   │   ├── upload/page.tsx      # Upload & text verification
│   │   │   ├── workspace/page.tsx   # 3-Panel Review Workspace
│   │   │   ├── terminology/page.tsx # Terminology dictionary
│   │   │   ├── reports/page.tsx     # Quality metrics & audit timeline
│   │   │   └── settings/page.tsx    # System config & language status
│   │   ├── components/layout/       # Sidebar, Header, AppShell
│   │   ├── lib/api.ts               # Typed client connecting to FastAPI
│   │   └── types/index.ts           # Shared TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.ts
│   └── Dockerfile
├── docs/
│   ├── architecture.md              # Technical architecture documentation
│   ├── user_guide.md                # Operator & demonstration walkthrough
│   └── evaluation_plan.md           # NESFIC challenge evaluation matrix
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 3. Quick Start & Local Execution

### Prerequisites
- **Python**: 3.11+
- **Node.js**: v18+ or v20+ with npm

---

### Step 1: Start Backend (FastAPI on Port 8000)

**On Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**On Linux / macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

*The backend will automatically create `jajabor.db` and seed synthetic demonstration documents and Assamese orthography rules.*

- **API Documentation (Swagger UI)**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

### Step 2: Start Frontend (Next.js on Port 3001)

```powershell
cd frontend
npm install
npm run build
npm run start -- -p 3001
```
*(Or for live development hot-reloading: `npm run dev -- -p 3001`)*

Open your browser at: **`http://localhost:3001`**

---

## 4. Running the Automated Test Suite

The backend contains automated tests verifying health check, file upload validation, text extraction, Assamese rule-based proofreading, clean text handling, finding lifecycle (accept/reject/edit), export generation, and terminology CRUD.

```powershell
cd backend
.\venv\Scripts\pytest.exe -v
```

**Test Results:**
```text
tests/test_api.py::test_health_check PASSED                              [ 12%]
tests/test_api.py::test_upload_invalid_file_extension PASSED             [ 25%]
tests/test_api.py::test_upload_and_extract_txt PASSED                    [ 37%]
tests/test_api.py::test_rule_based_proofreading_assamese PASSED          [ 50%]
tests/test_api.py::test_empty_findings_when_text_is_clean PASSED         [ 62%]
tests/test_api.py::test_finding_lifecycle_and_audit PASSED               [ 75%]
tests/test_api.py::test_export_endpoints PASSED                          [ 87%]
tests/test_api.py::test_terminology_crud PASSED                          [100%]
============================== 8 passed in 1.73s ==============================
```

---

## 5. Feature Status & Language Capabilities Matrix

| Capability | Status | Implementation Details |
| :--- | :--- | :--- |
| **Assamese Proofreading** | **Primary / Verified** | Modern Assamese orthography (non-gemination after reph `ৰ্`), danda spacing, duplicate words, whitespace, terminology. |
| **English Proofreading** | **Primary / Verified** | Capitalization after period, administrative typo dictionary, punctuation spacing, repeated words. |
| **Hindi Language** | **Experimental / Partial** | Devanagari boundary matching, repeated words, and whitespace rules. |
| **Bengali Language** | **Planned / Partial** | Common punctuation and repeated word detection. |
| **Review Workspace** | **Complete / Verified** | 3-panel workspace: accept, reject, edit, undo, bulk accept, persistent SQLite state. |
| **Terminology Dictionary** | **Complete / Verified** | Unicode-aware whole-word boundary matching with CRUD management. |
| **Audit Trail & Metrics** | **Complete / Verified** | Timestamped event logging (uploads, extraction, decisions, exports) and operational metrics. |
| **Document Formats** | **Complete / Verified** | DOCX, text-based PDF, and TXT extraction. Export to CSV, HTML, and reviewed DOCX. |
| **OCR for Scanned PDFs** | **Architected / Optional** | Detects scanned PDFs and flags that OCR is required rather than failing silently. |

---

## 6. Optional AI Provider Configuration

The core application runs deterministically **without any external API key**.

If you wish to evaluate optional AI-assisted contextual suggestions using Google Gemini:
1. Copy `.env.example` to `backend/.env`.
2. Configure:
   ```env
   AI_PROVIDER="gemini"
   AI_API_KEY="your-gemini-api-key"
   ```
3. Restart the backend. The AI provider enforces strict schema validation, request character limits, and safe error handling without overwriting source documents.

---

## 7. Security & Privacy Disclosure

- **Local Storage Sandbox**: Uploads are restricted to 15 MB, validated by extension, and stored under UUID-based names in `backend/uploads/`.
- **Read-Only Originals**: Uploaded original files are never modified in place.
- **Restricted Demo Mode**: Roles (Proofreader, Reviewer, Administrator) are designed for local evaluation. Production deployment requires departmental single-sign-on (SSO) integration.
