import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.terminology import Terminology

class TerminologyChecker:
    @staticmethod
    def check_terminology(text: str, language: str, db: Session) -> List[Dict[str, Any]]:
        findings = []
        # Fetch terminology rules for this language or universal rules
        entries = db.query(Terminology).filter(
            (Terminology.language == language) | (Terminology.language == "all")
        ).all()

        for entry in entries:
            approved = entry.approved_term
            # Disallowed variants can be separated by commas or newlines
            variants = [v.strip() for v in re.split(r"[,;\n]+", entry.disallowed_variants) if v.strip()]
            
            for variant in variants:
                # Use Unicode-aware word boundaries
                # In Indic scripts, \b is ASCII-only in standard regex, so we use (?<![\w\u0980-\u09FF\u0900-\u097F]) and (?!...)
                pattern_str = rf"(?<![\w\u0980-\u09FF\u0900-\u097F]){re.escape(variant)}(?![\w\u0980-\u09FF\u0900-\u097F])"
                pattern = re.compile(pattern_str, re.IGNORECASE | re.UNICODE)

                for match in pattern.finditer(text):
                    orig = match.group(0)
                    start = match.start()
                    end = match.end()
                    ctx_start = max(0, start - 25)
                    ctx_end = min(len(text), end + 25)
                    context = text[ctx_start:ctx_end]

                    expl = entry.explanation or f"Inconsistent terminology: Replace variant '{orig}' with approved standard term '{approved}'."

                    findings.append({
                        "category": "terminology",
                        "original_text": orig,
                        "suggested_correction": approved,
                        "context": f"...{context}...",
                        "explanation": f"[{entry.category}] {expl}",
                        "severity": "high",
                        "start_pos": start,
                        "end_pos": end,
                        "detection_method": f"terminology_dict:{entry.approved_term}",
                        "confidence": 1.0,
                    })

        return findings
