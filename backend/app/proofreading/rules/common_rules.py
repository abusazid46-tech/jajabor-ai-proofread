import re
from typing import List, Dict, Any

class CommonRules:
    @staticmethod
    def check_multiple_spaces(text: str, language: str) -> List[Dict[str, Any]]:
        findings = []
        # Match 2 or more horizontal spaces (not newlines)
        pattern = re.compile(r"[ \t]{2,}")
        for match in pattern.finditer(text):
            start = match.start()
            end = match.end()
            ctx_start = max(0, start - 25)
            ctx_end = min(len(text), end + 25)
            context = text[ctx_start:ctx_end]

            findings.append({
                "category": "whitespace",
                "original_text": match.group(),
                "suggested_correction": " ",
                "context": f"...{context}...",
                "explanation": "Multiple consecutive spaces detected; single space recommended for official publication standards.",
                "severity": "low",
                "start_pos": start,
                "end_pos": end,
                "detection_method": "deterministic_rule:repeated_whitespace",
                "confidence": 1.0,
            })
        return findings

    @staticmethod
    def check_repeated_words(text: str, language: str) -> List[Dict[str, Any]]:
        findings = []
        # Unicode word boundary matching
        # Matches word followed by one or more spaces and the exact same word
        # In Assamese/Indic scripts, words can contain unicode letters
        pattern = re.compile(r"\b([\w\u0980-\u09FF\u0900-\u097F]+)\s+(\1)\b", re.UNICODE | re.IGNORECASE)
        for match in pattern.finditer(text):
            full_match = match.group(0)
            word = match.group(1)
            # Some words in Assamese/Hindi can legitimately repeat (like লাহে লাহে or লাহে-লাহে, বাৰে বাৰে),
            # but in official notifications, repeated administrative keywords like "আদেশ আদেশ" or "the the" are errors.
            # Legitimate reduplication exceptions in Assamese:
            valid_reduplications = {"লাহে", "বাৰে", "আগলৈ", "নতুন", "সৰু", "ডাঙৰ", "ঘৰে", "মাজে", "পলমে"}
            if word.lower() in valid_reduplications:
                continue

            start = match.start()
            end = match.end()
            ctx_start = max(0, start - 25)
            ctx_end = min(len(text), end + 25)
            context = text[ctx_start:ctx_end]

            findings.append({
                "category": "repeated_words",
                "original_text": full_match,
                "suggested_correction": word,
                "context": f"...{context}...",
                "explanation": f"Unintentional duplicate consecutive word '{word}' detected.",
                "severity": "medium",
                "start_pos": start,
                "end_pos": end,
                "detection_method": "deterministic_rule:consecutive_duplicate_word",
                "confidence": 0.95,
            })
        return findings

    @staticmethod
    def check_space_before_punctuation(text: str, language: str) -> List[Dict[str, Any]]:
        findings = []
        # Matches space before , ; : ! ? and Assamese/Bengali danda ।
        pattern = re.compile(r"(\S)[ \t]+([,;:!?।])")
        for match in pattern.finditer(text):
            char_before = match.group(1)
            punct = match.group(2)
            orig = match.group(0)
            corr = f"{char_before}{punct}"
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
                "explanation": f"Unnecessary whitespace before punctuation mark '{punct}'. In formal typography, punctuation should directly follow the word.",
                "severity": "low",
                "start_pos": start,
                "end_pos": end,
                "detection_method": "deterministic_rule:space_before_punctuation",
                "confidence": 0.98,
            })
        return findings
