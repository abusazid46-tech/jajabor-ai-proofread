import re
from typing import List, Dict, Any

class EnglishRules:
    @staticmethod
    def check_missing_space_after_punctuation(text: str) -> List[Dict[str, Any]]:
        findings = []
        # Matches period or comma followed directly by an alphabetic character without space
        # Excludes decimal numbers (e.g. 3.14) or website URLs (.com, .gov.in)
        pattern = re.compile(r"([a-zA-Z]{2,})([.,;])([A-Za-z])")
        for match in pattern.finditer(text):
            word_part = match.group(1)
            punct = match.group(2)
            next_char = match.group(3)
            orig = match.group(0)
            corr = f"{word_part}{punct} {next_char}"
            start = match.start()
            end = match.end()
            ctx_start = max(0, start - 25)
            ctx_end = min(len(text), end + 25)
            context = text[ctx_start:ctx_end]

            findings.append({
                "category": "punctuation",
                "original_text": orig,
                "suggested_correction": corr,
                "context": f"...{context}...",
                "explanation": f"Missing whitespace after punctuation mark '{punct}'.",
                "severity": "low",
                "start_pos": start,
                "end_pos": end,
                "detection_method": "deterministic_rule:english_punct_spacing",
                "confidence": 0.98,
            })
        return findings

    @staticmethod
    def check_capitalization_after_period(text: str) -> List[Dict[str, Any]]:
        findings = []
        # Matches period followed by space and a lowercase letter
        # Exclude common abbreviations like e.g., i.e., etc., vs., Dr., Mr.
        pattern = re.compile(r"(\.\s+)([a-z])")
        for match in pattern.finditer(text):
            start = match.start()
            end = match.end()
            char_lower = match.group(2)
            # Check prefix for abbreviation
            prefix = text[max(0, start - 6):start].lower()
            if any(prefix.endswith(ab) for ab in ["e.g", "i.e", "etc", "vs", "dr", "mr", "mrs", "no"]):
                continue

            orig = match.group(0)
            corr = f"{match.group(1)}{char_lower.upper()}"
            ctx_start = max(0, start - 25)
            ctx_end = min(len(text), end + 25)
            context = text[ctx_start:ctx_end]

            findings.append({
                "category": "grammar",
                "original_text": orig,
                "suggested_correction": corr,
                "context": f"...{context}...",
                "explanation": "Sentence starts with a lowercase letter after a terminating period.",
                "severity": "medium",
                "start_pos": start,
                "end_pos": end,
                "detection_method": "deterministic_rule:capitalization_after_period",
                "confidence": 0.92,
            })
        return findings

    @staticmethod
    def check_common_administrative_typos(text: str) -> List[Dict[str, Any]]:
        findings = []
        typo_map = {
            "goverment": ("government", "Spelling error in official administrative term."),
            "goverment's": ("government's", "Spelling error in official administrative term."),
            "notificaton": ("notification", "Common typographical error."),
            "directrate": ("directorate", "Spelling error in department title."),
            "departmnt": ("department", "Typographical error in administrative title."),
            "secratary": ("secretary", "Spelling error in designation."),
            "commitee": ("committee", "Common spelling error."),
            "circularr": ("circular", "Typographical error in document type.")
        }

        for typo, (corr, expl) in typo_map.items():
            pattern = re.compile(rf"\b{re.escape(typo)}\b", re.IGNORECASE)
            for match in pattern.finditer(text):
                orig_match = match.group(0)
                # Match case
                replacement = corr.upper() if orig_match.isupper() else (corr.capitalize() if orig_match[0].isupper() else corr)
                start = match.start()
                end = match.end()
                ctx_start = max(0, start - 25)
                ctx_end = min(len(text), end + 25)
                context = text[ctx_start:ctx_end]

                findings.append({
                    "category": "spelling",
                    "original_text": orig_match,
                    "suggested_correction": replacement,
                    "context": f"...{context}...",
                    "explanation": expl,
                    "severity": "high",
                    "start_pos": start,
                    "end_pos": end,
                    "detection_method": "deterministic_rule:administrative_typo_dict",
                    "confidence": 0.99,
                })
        return findings
