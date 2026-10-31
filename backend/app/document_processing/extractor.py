import os
import uuid
from pathlib import Path
from typing import Tuple, List, Dict, Any
from app.core.config import settings

class ExtractionError(Exception):
    pass

class DocumentExtractor:
    @staticmethod
    def get_safe_storage_path(original_filename: str) -> Tuple[str, str]:
        ext = Path(original_filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise ExtractionError(f"Unsupported file format '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}")
        
        safe_id = str(uuid.uuid4())
        safe_filename = f"{safe_id}{ext}"
        storage_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        return safe_filename, storage_path

    @staticmethod
    def extract_text(file_path: str, file_type: str) -> Tuple[str, Dict[str, Any]]:
        """
        Extracts plain text and metadata from uploaded file.
        Returns (extracted_text, metadata_info)
        """
        path = Path(file_path)
        if not path.exists():
            raise ExtractionError(f"File not found at: {file_path}")
        
        size = path.stat().st_size
        if size > settings.MAX_FILE_SIZE_BYTES:
            raise ExtractionError(f"File size ({size} bytes) exceeds limit of {settings.MAX_FILE_SIZE_BYTES} bytes.")

        file_type = file_type.lower().replace(".", "")

        if file_type == "txt":
            return DocumentExtractor._extract_txt(file_path)
        elif file_type == "docx":
            return DocumentExtractor._extract_docx(file_path)
        elif file_type == "pdf":
            return DocumentExtractor._extract_pdf(file_path)
        else:
            raise ExtractionError(f"Unsupported document format: {file_type}")

    @staticmethod
    def _extract_txt(file_path: str) -> Tuple[str, Dict[str, Any]]:
        encodings = ["utf-8", "utf-16", "iso-8859-1", "cp1252"]
        content = ""
        used_enc = None
        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    content = f.read()
                used_enc = enc
                break
            except (UnicodeDecodeError, UnicodeError):
                continue
        
        if used_enc is None:
            raise ExtractionError("Unable to decode text file. Please ensure it is saved in UTF-8 format.")
        
        lines = [l for l in content.splitlines()]
        return content, {
            "format": "txt",
            "encoding": used_enc,
            "paragraph_count": len(lines),
            "char_count": len(content),
            "warnings": []
        }

    @staticmethod
    def _extract_docx(file_path: str) -> Tuple[str, Dict[str, Any]]:
        import docx
        try:
            doc = docx.Document(file_path)
        except Exception as e:
            raise ExtractionError(f"Failed to read DOCX file: {str(e)}")

        paragraphs = []
        for p in doc.paragraphs:
            text = p.text.strip()
            if text:
                paragraphs.append(text)

        # Also extract table text
        table_paragraphs = []
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    table_paragraphs.append(" | ".join(row_cells))

        all_text = "\n\n".join(paragraphs + table_paragraphs)
        if not all_text.strip():
            raise ExtractionError("The DOCX document is empty or contains no readable text paragraphs.")

        warnings = []
        if len(doc.inline_shapes) > 0:
            warnings.append("Document contains embedded images/shapes that are not included in text proofreading.")

        return all_text, {
            "format": "docx",
            "paragraph_count": len(paragraphs),
            "table_count": len(doc.tables),
            "char_count": len(all_text),
            "warnings": warnings
        }

    @staticmethod
    def _extract_pdf(file_path: str) -> Tuple[str, Dict[str, Any]]:
        import pypdf
        try:
            reader = pypdf.PdfReader(file_path)
        except Exception as e:
            raise ExtractionError(f"Failed to parse PDF: {str(e)}")

        page_texts = []
        total_pages = len(reader.pages)
        for idx, page in enumerate(reader.pages):
            txt = page.extract_text() or ""
            if txt.strip():
                page_texts.append(txt.strip())

        extracted = "\n\n".join(page_texts)
        # Check if PDF appears scanned / image-only
        if len(extracted.strip()) < 20:
            raise ExtractionError(
                "PDF text extraction returned negligible content. The document appears to be a scanned image "
                "or raster PDF. An OCR engine (e.g., Tesseract Assamese/English model) is required for scanned documents."
            )

        return extracted, {
            "format": "pdf",
            "page_count": total_pages,
            "char_count": len(extracted),
            "warnings": ["PDF extraction extracts flow text; exact layout is preserved in reports only."]
        }
