import os
from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.finding import Finding
from app.models.terminology import Terminology
from app.models.audit import AuditEvent
from app.core.config import settings

def seed_database(db: Session):
    """
    Seeds initial synthetic demonstration documents, terminology rules, and audit history.
    All data is clearly labelled as demonstration material.
    """
    # 1. Seed Terminology Dictionary
    if db.query(Terminology).count() == 0:
        sample_terms = [
            Terminology(
                approved_term="কাৰ্যালয়",
                disallowed_variants="কাৰ্য্যালয়, কাৰয্যালয়",
                language="as",
                category="Administrative Orthography",
                explanation="Modern standard Assamese orthography per Asam Sahitya Sabha: consonants following reph (ৰ্) do not geminate.",
                is_sample=1
            ),
            Terminology(
                approved_term="চৰকাৰী",
                disallowed_variants="গভৰ্ণমেণ্ট, চৰকাৰী কাৰ্য্যালয়",
                language="as",
                category="Standard Terminology",
                explanation="Official Assamese publication term: 'চৰকাৰী' is standard for official government notifications.",
                is_sample=1
            ),
            Terminology(
                approved_term="নিৰ্দেশনা",
                disallowed_variants="নিৰ্দ্দেশনা, নিৰ্দ্দেশ",
                language="as",
                category="Administrative Directives",
                explanation="Standard non-geminated spelling 'নিৰ্দেশনা' (guidelines/instructions).",
                is_sample=1
            ),
            Terminology(
                approved_term="Directorate",
                disallowed_variants="Directrate, Directorat",
                language="en",
                category="Department Names",
                explanation="Standard spelling for government directorates.",
                is_sample=1
            ),
            Terminology(
                approved_term="Notification",
                disallowed_variants="Notificaton, Notifcation",
                language="en",
                category="Official Documents",
                explanation="Standard nomenclature for gazette notifications.",
                is_sample=1
            ),
            Terminology(
                approved_term="Printing and Stationery",
                disallowed_variants="Printing and Stationary, Printing & Stationary",
                language="en",
                category="Administrative Standards",
                explanation="'Stationery' (writing and office supplies with 'e') vs 'stationary' (immobile).",
                is_sample=1
            )
        ]
        db.add_all(sample_terms)
        db.commit()

    # 2. Seed Synthetic Demonstration Document
    if db.query(Document).count() == 0:
        # Assamese Synthetic Notification
        as_text = (
            "অসম চৰকাৰ\n"
            "তথ্য, মুদ্ৰণ আৰু লেখন-সামগ্ৰী বিভাগ\n"
            "মুদ্ৰণ আৰু লেখন-সামগ্ৰী সঞ্চালকালয়\n"
            "গুৱাহাটী-২১\n\n"
            "অধিসূচনা [আৰ্হি / ডেমো নথি]\n\n"
            "ইয়াৰ দ্বাৰা জনোৱা হয় যে সকলো চৰকাৰী কাৰ্য্যালয়ৰ বাবে এই নতুন নিয়ম প্ৰযোজ্য হ'ব।সকলো "
            "বিষয়ববীয়াক এই নীতি কঠোৰভাৱে পালন কৰিবলৈ নিৰ্দ্দেশ দিয়া হ'ল।\n\n"
            "উক্ত আদেশ আদেশ অনুসৰি সকলো বিভাগে সাপ্তাহিক প্ৰতিবেদন দাখিল কৰিব লাগিব  । "
            "এই নিৰ্দেশনা তাৎক্ষণিকভাৱে কাৰ্যকৰী হ'ব। ৰাজ্যৰ সকলো জিলা উপায়ুক্তলৈ ইয়াৰ প্ৰতিলিপি প্ৰেৰণ কৰা হ'ল।\n\n"
            "সঞ্চালক,\n"
            "মুদ্ৰণ আৰু লেখন-সামগ্ৰী সঞ্চালকালয়, অসম।"
        )

        sample_as_doc = Document(
            id="demo-doc-assamese-01",
            original_filename="DEMO_Assam_Printing_Notification_Assamese.txt",
            storage_path=os.path.join(settings.UPLOAD_DIR, "demo_notification_as.txt"),
            file_type="txt",
            file_size=len(as_text.encode("utf-8")),
            language="as",
            status="awaiting_review",
            original_text=as_text,
            reviewed_text=as_text,
            department="Assam Information, Printing & Stationery Department",
            document_type="Gazette Notification [Synthetic Sample]",
            is_sample=1
        )
        db.add(sample_as_doc)
        db.commit()

        # Seed Findings for Assamese demo document
        as_findings = [
            Finding(
                document_id="demo-doc-assamese-01",
                language="as",
                category="terminology",
                original_text="কাৰ্য্যালয়ৰ",
                suggested_correction="কাৰ্যালয়ৰ",
                context="...সকলো চৰকাৰী কাৰ্য্যালয়ৰ বাবে এই নতুন নিয়ম...",
                explanation="[Administrative Orthography] Modern standard Assamese orthography: consonants following reph (ৰ্) do not geminate.",
                severity="medium",
                start_pos=as_text.find("কাৰ্য্যালয়ৰ"),
                end_pos=as_text.find("কাৰ্য্যালয়ৰ") + len("কাৰ্য্যালয়ৰ"),
                detection_method="terminology_dict:কাৰ্যালয়",
                confidence=1.0,
                review_status="pending"
            ),
            Finding(
                document_id="demo-doc-assamese-01",
                language="as",
                category="punctuation",
                original_text="হ'ব।সকলো",
                suggested_correction="হ'ব। সকলো",
                context="...প্ৰযোজ্য হ'ব।সকলো বিষয়ববীয়াক এই নীতি...",
                explanation="Missing whitespace after Assamese danda (দাড়ি '।'). A space is required after sentence termination in official publications.",
                severity="low",
                start_pos=as_text.find("হ'ব।সকলো"),
                end_pos=as_text.find("হ'ব।সকলো") + len("হ'ব।সকলো"),
                detection_method="deterministic_rule:assamese_danda_spacing",
                confidence=0.99,
                review_status="pending"
            ),
            Finding(
                document_id="demo-doc-assamese-01",
                language="as",
                category="spelling",
                original_text="নিৰ্দ্দেশ",
                suggested_correction="নিৰ্দেশ",
                context="...কঠোৰভাৱে পালন কৰিবলৈ নিৰ্দ্দেশ দিয়া হ'ল।...",
                explanation="Modern Assamese orthography standard: 'নিৰ্দেশ' (directive/instruction).",
                severity="medium",
                start_pos=as_text.find("নিৰ্দ্দেশ"),
                end_pos=as_text.find("নিৰ্দ্দেশ") + len("নিৰ্দ্দেশ"),
                detection_method="deterministic_rule:assamese_modern_orthography",
                confidence=0.99,
                review_status="pending"
            ),
            Finding(
                document_id="demo-doc-assamese-01",
                language="as",
                category="repeated_words",
                original_text="আদেশ আদেশ",
                suggested_correction="আদেশ",
                context="...উক্ত আদেশ আদেশ অনুসৰি সকলো বিভাগে...",
                explanation="Unintentional duplicate consecutive word 'আদেশ' detected.",
                severity="medium",
                start_pos=as_text.find("আদেশ আদেশ"),
                end_pos=as_text.find("আদেশ আদেশ") + len("আদেশ আদেশ"),
                detection_method="deterministic_rule:consecutive_duplicate_word",
                confidence=0.95,
                review_status="pending"
            ),
            Finding(
                document_id="demo-doc-assamese-01",
                language="as",
                category="whitespace",
                original_text="  ।",
                suggested_correction="।",
                context="...প্ৰতিবেদন দাখিল কৰিব লাগিব  । এই নিৰ্দেশনা...",
                explanation="Unnecessary whitespace before punctuation mark '।'. In formal typography, punctuation directly follows the word.",
                severity="low",
                start_pos=as_text.find("  ।"),
                end_pos=as_text.find("  ।") + len("  ।"),
                detection_method="deterministic_rule:space_before_punctuation",
                confidence=0.98,
                review_status="pending"
            )
        ]
        db.add_all(as_findings)

        # English Synthetic Circular
        en_text = (
            "GOVERNMENT OF ASSAM\n"
            "INFORMATION, PRINTING & STATIONERY DEPARTMENT\n"
            "DIRECTORATE OF PRINTING & STATIONERY\n"
            "GUWAHATI-781021\n\n"
            "CIRCULAR [SYNTHETIC DEMONSTRATION SAMPLE]\n\n"
            "This is to notify that all official publications must comply with the the revised "
            "typography and proofreading standards. The directrate will conduct monthly reviews.\n\n"
            "All concerned officials are requested to submit draft notifications well in advance  . "
            "late submissions will not be entertained for gazette inclusion. Standard guidelines apply.\n\n"
            "Director,\n"
            "Directorate of Printing & Stationery, Assam."
        )

        sample_en_doc = Document(
            id="demo-doc-english-02",
            original_filename="DEMO_Assam_Printing_Circular_English.txt",
            storage_path=os.path.join(settings.UPLOAD_DIR, "demo_circular_en.txt"),
            file_type="txt",
            file_size=len(en_text.encode("utf-8")),
            language="en",
            status="awaiting_review",
            original_text=en_text,
            reviewed_text=en_text,
            department="Assam Information, Printing & Stationery Department",
            document_type="Departmental Circular [Synthetic Sample]",
            is_sample=1
        )
        db.add(sample_en_doc)
        db.commit()

        en_findings = [
            Finding(
                document_id="demo-doc-english-02",
                language="en",
                category="repeated_words",
                original_text="the the",
                suggested_correction="the",
                context="...must comply with the the revised typography...",
                explanation="Unintentional duplicate consecutive word 'the' detected.",
                severity="medium",
                start_pos=en_text.find("the the"),
                end_pos=en_text.find("the the") + len("the the"),
                detection_method="deterministic_rule:consecutive_duplicate_word",
                confidence=0.95,
                review_status="pending"
            ),
            Finding(
                document_id="demo-doc-english-02",
                language="en",
                category="spelling",
                original_text="directrate",
                suggested_correction="directorate",
                context="...typography and proofreading standards. The directrate will conduct...",
                explanation="Spelling error in department title.",
                severity="high",
                start_pos=en_text.find("directrate"),
                end_pos=en_text.find("directrate") + len("directrate"),
                detection_method="deterministic_rule:administrative_typo_dict",
                confidence=0.99,
                review_status="pending"
            ),
            Finding(
                document_id="demo-doc-english-02",
                language="en",
                category="grammar",
                original_text=". late",
                suggested_correction=". Late",
                context="...well in advance  . late submissions will not be...",
                explanation="Sentence starts with a lowercase letter after a terminating period.",
                severity="medium",
                start_pos=en_text.find(". late"),
                end_pos=en_text.find(". late") + len(". late"),
                detection_method="deterministic_rule:capitalization_after_period",
                confidence=0.92,
                review_status="pending"
            )
        ]
        db.add_all(en_findings)

        # Audit events for seeded docs
        db.add(AuditEvent(
            document_id="demo-doc-assamese-01",
            action="document_uploaded",
            actor="System Seeder",
            details="Loaded synthetic Assamese demonstration notification for NESFIC-D-38."
        ))
        db.add(AuditEvent(
            document_id="demo-doc-assamese-01",
            action="analysis_completed",
            actor="Proofreading Engine",
            details="Seeded initial 5 demonstration findings (repeated words, danda spacing, orthography, whitespace)."
        ))
        db.add(AuditEvent(
            document_id="demo-doc-english-02",
            action="document_uploaded",
            actor="System Seeder",
            details="Loaded synthetic English demonstration circular for NESFIC-D-38."
        ))

        db.commit()
