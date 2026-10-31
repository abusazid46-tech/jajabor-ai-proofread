import re
from typing import List, Dict, Any

class AssameseRules:
    """
    Deterministic proofreading checks for Assamese official publications and administrative texts.
    Based on standard modern Assamese orthography (Asam Sahitya Sabha orthographic guidelines)
    and administrative conventions of the Assam Directorate of Printing & Stationery.
    """

    @staticmethod
    def check_missing_space_after_danda(text: str) -> List[Dict[str, Any]]:
        findings = []
        # Matches danda '।' followed immediately by an Assamese/alphanumeric character without a space or newline
        pattern = re.compile(r"(।)([\u0980-\u09FF\w])")
        for match in pattern.finditer(text):
            danda = match.group(1)
            next_char = match.group(2)
            orig = match.group(0)
            corr = f"{danda} {next_char}"
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
                "explanation": "Missing whitespace after Assamese danda (দাড়ি '।'). A space is required after sentence termination in official publications.",
                "severity": "low",
                "start_pos": start,
                "end_pos": end,
                "detection_method": "deterministic_rule:assamese_danda_spacing",
                "confidence": 0.99,
            })
        return findings

    @staticmethod
    def check_repeated_danda(text: str) -> List[Dict[str, Any]]:
        findings = []
        # In prose / official circulars, double danda '।।' is only valid in poetry/slokas, not official notifications
        pattern = re.compile(r"([ \t]*।){2,}")
        for match in pattern.finditer(text):
            orig = match.group(0)
            corr = "।"
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
                "explanation": "Repeated danda ('।।') detected. In administrative documents, notifications, and gazettes, single danda ('।') is standard.",
                "severity": "low",
                "start_pos": start,
                "end_pos": end,
                "detection_method": "deterministic_rule:assamese_single_danda",
                "confidence": 0.95,
            })
        return findings

    @staticmethod
    def check_modern_orthography_gemination(text: str) -> List[Dict[str, Any]]:
        """
        In modern Assamese orthography (Asam Sahitya Sabha standard), consonants following
        reph (ৰ্) are not doubled (e.g. কাৰ্য্যালয় -> কাৰ্যালয়, নিৰ্দ্দেশ -> নিৰ্দেশ, কৰ্ত্তব্য -> কৰ্তব্য, সূৰ্য্য -> সূৰ্য).
        """
        findings = []
        orthography_map = {
            "কাৰ্য্যালয়": ("কাৰ্যালয়", "In modern standard Assamese orthography, consonants following reph (ৰ্) do not geminate. 'কাৰ্যালয়' is standard."),
            "কাৰ্য্যালয়ৰ": ("কাৰ্যালয়ৰ", "Standard modern spelling without redundant consonant gemination."),
            "নিৰ্দ্দেশ": ("নিৰ্দেশ", "Modern Assamese orthography standard: 'নিৰ্দেশ' (directive/instruction)."),
            "নিৰ্দ্দেশনা": ("নিৰ্দেশনা", "Modern Assamese orthography standard: 'নিৰ্দেশনা' (guidelines)."),
            "কৰ্ত্তব্য": ("কৰ্তব্য", "Modern Assamese orthography standard: 'কৰ্তব্য' (duty)."),
            "সূৰ্য্য": ("সূৰ্য", "Modern Assamese orthography standard: 'সূৰ্য' (sun/solar)."),
            "ধৰ্ম্ম": ("ধৰ্ম", "Modern Assamese orthography standard: 'ধৰ্ম'."),
            "কৰ্ম্মচাৰী": ("কৰ্মচাৰী", "Modern Assamese orthography standard: 'কৰ্মচাৰী' (employee)."),
            "কৰ্ম্মচাৰীবৃন্দ": ("কৰ্মচাৰীবৃন্দ", "Modern Assamese orthography standard: 'কৰ্মচাৰীবৃন্দ'."),
            "বৰ্ত্তমান": ("বৰ্তমান", "Modern Assamese orthography standard: 'বৰ্তমান' (present/currently).")
        }

        for archaic, (modern, expl) in orthography_map.items():
            pattern = re.compile(rf"(?<![\u0980-\u09FF\w]){re.escape(archaic)}(?![\u0980-\u09FF\w])")
            for match in pattern.finditer(text):
                start = match.start()
                end = match.end()
                ctx_start = max(0, start - 25)
                ctx_end = min(len(text), end + 25)
                context = text[ctx_start:ctx_end]

                findings.append({
                    "category": "spelling",
                    "original_text": match.group(0),
                    "suggested_correction": modern,
                    "context": f"...{context}...",
                    "explanation": expl,
                    "severity": "medium",
                    "start_pos": start,
                    "end_pos": end,
                    "detection_method": "deterministic_rule:assamese_modern_orthography",
                    "confidence": 0.99,
                })
        return findings

    @staticmethod
    def check_assamese_number_date_heuristic(text: str) -> List[Dict[str, Any]]:
        """
        Detects mixed Latin numerals directly inside Assamese words or inconsistent notification date formatting.
        """
        findings = []
        # Match Assamese letter directly attached to ASCII digit without space/punctuation: e.g. "তাৰিখ25" or "আদেশ2026"
        pattern = re.compile(r"([\u0980-\u09FF]+)(\d+)")
        for match in pattern.finditer(text):
            word_part = match.group(1)
            num_part = match.group(2)
            orig = match.group(0)
            corr = f"{word_part} {num_part}"
            start = match.start()
            end = match.end()
            ctx_start = max(0, start - 25)
            ctx_end = min(len(text), end + 25)
            context = text[ctx_start:ctx_end]

            findings.append({
                "category": "number_date",
                "original_text": orig,
                "suggested_correction": corr,
                "context": f"...{context}...",
                "explanation": "Numeral directly attached to Assamese text without spacing. Add a space between text and numbers.",
                "severity": "low",
                "start_pos": start,
                "end_pos": end,
                "detection_method": "deterministic_rule:assamese_numeral_boundary",
                "confidence": 0.95,
            })
        return findings
