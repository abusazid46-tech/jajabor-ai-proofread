# Jajabor AI Proofread &mdash; NESFIC 2026 Evaluation Plan

## 1. Challenge Alignment (NESFIC-D-38)
- **Challenge Title**: Faster, More Consistent Multilingual Proofreading of Government Documents
- **Challenge Owner**: Assam Information, Printing & Stationery Department &mdash; Directorate of Printing & Stationery.

---

## 2. Evaluation Criteria Matrix

| Criterion | Implementation in Prototype | Demonstration Verification |
| :--- | :--- | :--- |
| **Multilingual Coverage** | Authentic Assamese script and English administrative text. | Seeded with authentic Assamese notification and English circular. |
| **Deterministic Consistency** | Rules strictly enforce Asam Sahitya Sabha orthographic guidelines and standard official publication style. | Reproducible finding generation across re-runs. |
| **Terminology Adherence** | Database-driven terminology dictionary with Unicode word boundaries. | Correctly detects variants (`কাৰ্য্যালয়ৰ` &rarr; `কাৰ্যালয়ৰ`). |
| **Reviewer Agency** | Proofreader retains 100% control to accept, reject, or manually customize any correction. | 3-panel workspace with persisted decisions and audit logs. |
| **Offline Independence** | Zero reliance on external paid APIs or cloud dependencies for core demo. | Rule-based fallback active by default; runs entirely on local machine. |
| **Format Integrity** | Supports DOCX, text-based PDF, and TXT. Export in CSV, HTML, and reviewed DOCX. | Preserves original uploaded file unmodified; outputs clean reviewed DOCX. |

---

## 3. Recommended Next Steps for Field Pilot
1. **Pilot with Official Gazette Corpus**: Test the rule engine against a batch of 50 historical Assam Gazette notifications.
2. **Directorate Lexicon Expansion**: Expand the terminology dictionary with official designations and department nomenclature from the Assam Secretariat Manual.
3. **Dedicated OCR Pipeline**: Integrate Tesseract with an Assamese-trained model for scanned historical gazettes.
