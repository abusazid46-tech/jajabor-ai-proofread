# Jajabor AI Proofread &mdash; Technical Architecture
**Programme:** NESFIC 2026 (Stream 1) &bull; **Challenge ID:** NESFIC-D-38  
**Challenge Owner:** Assam Information, Printing & Stationery Department &mdash; Directorate of Printing & Stationery  

---

## 1. Executive Architecture Overview

Jajabor AI Proofread is designed as a modular, human-in-the-loop document quality assurance platform. Official publications (notifications, gazettes, departmental reports, administrative circulars) demand strict orthographic fidelity and accountability.

The system is decoupled into:
1. **Frontend Presentation Layer (Next.js 15 App Router & Tailwind CSS)**: High-efficiency administrative console with 3-panel review workspace, vocabulary management, real-time metrics, and audit log viewer.
2. **Backend Engine (FastAPI & SQLAlchemy)**: RESTful API providing safe text extraction (DOCX, PDF, TXT), deterministic orthographic rule engines, database-driven terminology enforcement, audit logging, and downloadable reports (CSV, HTML, reviewed DOCX).
3. **Proofreading Engine (Modular Pipeline)**:
   - **Deterministic Fallback Engine (Active)**: 100% offline, zero-dependency on paid external APIs. Employs Asam Sahitya Sabha orthography standards (reph non-gemination, danda spacing, duplicate words, punctuation formatting).
   - **Terminology Subsystem**: Unicode-aware boundary matching preventing substrings corruption.
   - **Optional AI Provider Interface**: Strict schema validation, timeouts, prompt framing treating document text as untrusted data, and no hallucinated rewriting.

---

## 2. System Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           Next.js 15 Frontend                                     |
|  [Overview] [Documents] [Upload] [3-Panel Review Workspace] [Glossaries] [Reports] |
+------------------------------------------+----------------------------------------+
                                           | HTTP REST API (/api/*)
                                           v
+-----------------------------------------------------------------------------------+
|                              FastAPI Backend                                      |
|  +--------------------+  +----------------------+  +----------------------------+ |
|  | Document Extraction|  | Modular Proofreading |  | Verification & Exporter    | |
|  | - python-docx      |  | - Common Rules       |  | - CSV Audit Report         | |
|  | - pypdf (text flow)|  | - Assamese Rules     |  | - Standalone HTML Report   | |
|  | - UTF-8 Text reader|  | - English Rules      |  | - Clean Reviewed DOCX      | |
|  | - Size & Ext checks|  | - Terminology Matcher|  |   (Original preserved)     | |
|  | - Scanned PDF flag |  | - Optional AI Abstr. |  +----------------------------+ |
|  +--------------------+  +----------------------+                                 |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        Storage & Persistence Layer                                |
|  - SQLite (jajabor.db) via SQLAlchemy ORM (Documents, Findings, Terminology, Audit)|
|  - Isolated File Storage (backend/uploads/ - UUID paths)                          |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Integrity & Security Safeguards

- **Untrusted Input Handling**: Uploaded files are assigned server-side UUIDs. Filenames are preserved as metadata only, preventing path traversal attacks (`../`).
- **No Document Destruction**: Original uploaded files are strictly read-only and never overwritten. The reviewed document is generated as a distinct entity upon reviewer confirmation.
- **Human Accountability**: No document is marked officially approved by automation. All findings require reviewer accept, reject, or edit decisions.
- **Offline Reliability**: The core evaluation workflow operates with zero paid external API dependencies.
