import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.proofreading.rules.common_rules import CommonRules
from app.proofreading.rules.assamese_rules import AssameseRules
from app.proofreading.rules.english_rules import EnglishRules
from app.proofreading.terminology_checker import TerminologyChecker
from app.proofreading.ai_provider import get_ai_provider

logger = logging.getLogger(__name__)

class ProofreadingEngine:
    @classmethod
    async def analyze_document(
        cls,
        text: str,
        language: str = "as",
        db: Session = None,
        use_ai: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Executes modular proofreading pipeline and returns structured findings.
        Returns an empty list if no errors are detected.
        """
        if not text or not text.strip():
            return []

        all_findings: List[Dict[str, Any]] = []

        # 1. Universal / Common Rules
        all_findings.extend(CommonRules.check_multiple_spaces(text, language))
        all_findings.extend(CommonRules.check_repeated_words(text, language))
        all_findings.extend(CommonRules.check_space_before_punctuation(text, language))

        # 2. Language-Specific Deterministic Rules
        if language == "as":
            all_findings.extend(AssameseRules.check_missing_space_after_danda(text))
            all_findings.extend(AssameseRules.check_repeated_danda(text))
            all_findings.extend(AssameseRules.check_modern_orthography_gemination(text))
            all_findings.extend(AssameseRules.check_assamese_number_date_heuristic(text))
        elif language == "en":
            all_findings.extend(EnglishRules.check_missing_space_after_punctuation(text))
            all_findings.extend(EnglishRules.check_capitalization_after_period(text))
            all_findings.extend(EnglishRules.check_common_administrative_typos(text))
        elif language in ("hi", "bn"):
            # Partial / experimental support: common rules already applied
            pass

        # 3. Terminology Rules (from database)
        if db:
            try:
                term_findings = TerminologyChecker.check_terminology(text, language, db)
                all_findings.extend(term_findings)
            except Exception as e:
                logger.error(f"Terminology check failed: {str(e)}")

        # 4. Optional AI-Assisted Findings
        if use_ai:
            provider = get_ai_provider()
            ai_findings = await provider.analyze(text, language)
            all_findings.extend(ai_findings)

        # 5. Deduplicate findings with identical start_pos & category
        unique_findings = []
        seen = set()
        for f in all_findings:
            key = (f.get("start_pos"), f.get("category"), f.get("original_text"))
            if key not in seen:
                seen.add(key)
                unique_findings.append(f)

        # Sort by start position
        unique_findings.sort(key=lambda x: x.get("start_pos") if x.get("start_pos") is not None else 999999)

        return unique_findings
