import csv
import io
import os
import html
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import docx
from docx.shared import Inches, Pt, RGBColor
from app.core.config import settings

class DocumentExporter:
    @staticmethod
    def generate_csv_report(doc_data: Dict[str, Any], findings: List[Dict[str, Any]]) -> str:
        """
        Generates CSV content of the proofreading review audit report.
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header row
        writer.writerow([
            "Finding ID",
            "Document Name",
            "Language",
            "Category",
            "Severity",
            "Original Text",
            "Suggested Correction",
            "Final Reviewed Correction",
            "Review Decision",
            "Explanation",
            "Detection Method",
            "Context"
        ])
        
        doc_name = doc_data.get("original_filename", "Document")
        lang = doc_data.get("language", "as")
        
        for f in findings:
            status = f.get("review_status", "pending")
            final_corr = ""
            if status == "accepted":
                final_corr = f.get("suggested_correction") or ""
            elif status == "edited":
                final_corr = f.get("user_edited_correction") or f.get("suggested_correction") or ""
            elif status == "rejected":
                final_corr = "[REJECTED - KEPT ORIGINAL]"
            else:
                final_corr = "[PENDING REVIEW]"

            writer.writerow([
                f.get("id"),
                doc_name,
                lang,
                f.get("category"),
                f.get("severity"),
                f.get("original_text"),
                f.get("suggested_correction") or "",
                final_corr,
                status.upper(),
                f.get("explanation"),
                f.get("detection_method"),
                f.get("context") or ""
            ])
            
        return output.getvalue()

    @staticmethod
    def generate_html_report(doc_data: Dict[str, Any], findings: List[Dict[str, Any]]) -> str:
        """
        Generates a standalone, readable HTML summary report.
        """
        doc_name = html.escape(doc_data.get("original_filename", "Document"))
        lang = doc_data.get("language", "as").upper()
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        
        accepted = sum(1 for f in findings if f.get("review_status") == "accepted")
        rejected = sum(1 for f in findings if f.get("review_status") == "rejected")
        edited = sum(1 for f in findings if f.get("review_status") == "edited")
        pending = sum(1 for f in findings if f.get("review_status") == "pending")
        total = len(findings)

        rows_html = ""
        for idx, f in enumerate(findings, 1):
            status = f.get("review_status", "pending")
            status_badge_color = {
                "accepted": "#16a34a",
                "rejected": "#dc2626",
                "edited": "#2563eb",
                "pending": "#ca8a04"
            }.get(status, "#6b7280")
            
            orig = html.escape(f.get("original_text", ""))
            sugg = html.escape(f.get("suggested_correction") or "—")
            user_edit = html.escape(f.get("user_edited_correction") or "")
            cat = html.escape(f.get("category", "").replace("_", " ").title())
            expl = html.escape(f.get("explanation", ""))
            
            final_text = sugg
            if status == "edited" and user_edit:
                final_text = f"<strong>Custom Edit:</strong> {user_edit}"
            elif status == "rejected":
                final_text = "<em>Retained original</em>"
            
            rows_html += f"""
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; font-weight: 500;">{idx}</td>
                <td style="padding: 10px;"><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px;">{cat}</span></td>
                <td style="padding: 10px; color: #991b1b; font-family: monospace;">{orig}</td>
                <td style="padding: 10px; color: #166534; font-family: monospace;">{final_text}</td>
                <td style="padding: 10px; font-size: 13px; color: #4b5563;">{expl}</td>
                <td style="padding: 10px;">
                    <span style="background: {status_badge_color}; color: #fff; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                        {status}
                    </span>
                </td>
            </tr>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Proofreading Report - {doc_name}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1e293b; background: #f8fafc; }}
        .card {{ background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 1000px; margin: 0 auto; }}
        .header {{ border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }}
        .notice {{ background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; color: #1e40af; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }}
        .stat-box {{ background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; text-align: center; }}
        .stat-val {{ font-size: 20px; font-weight: bold; color: #0f172a; }}
        .stat-lbl {{ font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 4px; }}
        table {{ width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }}
        th {{ background: #f1f5f9; padding: 10px; font-weight: 600; font-size: 12px; color: #475569; text-transform: uppercase; }}
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1 style="margin: 0 0 6px 0; color: #0f172a; font-size: 22px;">Jajabor AI Proofread &mdash; Verification Audit Report</h1>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Document: <strong>{doc_name}</strong> | Language: <strong>{lang}</strong> | Date: {now_str}</p>
        </div>

        <div class="notice">
            <strong>Human Proofreader Responsibility Notice:</strong> This audit report records findings generated by the automated engine and decisions made by the reviewer. Automated suggestions do not constitute official approval.
        </div>

        <div class="stats-grid">
            <div class="stat-box"><div class="stat-val">{total}</div><div class="stat-lbl">Total Findings</div></div>
            <div class="stat-box"><div class="stat-val" style="color: #16a34a;">{accepted}</div><div class="stat-lbl">Accepted</div></div>
            <div class="stat-box"><div class="stat-val" style="color: #2563eb;">{edited}</div><div class="stat-lbl">Edited</div></div>
            <div class="stat-box"><div class="stat-val" style="color: #dc2626;">{rejected}</div><div class="stat-lbl">Rejected</div></div>
            <div class="stat-box"><div class="stat-val" style="color: #ca8a04;">{pending}</div><div class="stat-lbl">Pending</div></div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Category</th>
                    <th>Original Text</th>
                    <th>Review Result</th>
                    <th>Explanation</th>
                    <th>Decision</th>
                </tr>
            </thead>
            <tbody>
                {rows_html if rows_html else '<tr><td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">No findings recorded for this document.</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>
"""
        return html_content

    @staticmethod
    def generate_reviewed_docx(doc_data: Dict[str, Any], reviewed_text: str, filename_prefix: str = "reviewed_") -> str:
        """
        Creates a new clean DOCX file containing the reviewed text.
        Never alters the original uploaded document.
        """
        doc = docx.Document()
        
        # Add Header banner
        header_p = doc.add_paragraph()
        run = header_p.add_run("Jajabor AI Proofread — Reviewed Output Document\n")
        run.bold = True
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(15, 23, 42)
        
        sub = header_p.add_run(
            f"Source Document: {doc_data.get('original_filename', 'Unknown')} | "
            f"Review Date: {datetime.utcnow().strftime('%Y-%m-%d')} | "
            f"Status: Human Verified Prototype Output\n"
            "------------------------------------------------------------------------------------------\n"
        )
        sub.font.size = Pt(9)
        sub.font.color.rgb = RGBColor(100, 116, 139)

        # Add paragraphs of reviewed text
        paragraphs = reviewed_text.split("\n\n") if reviewed_text else []
        for p_text in paragraphs:
            lines = p_text.splitlines()
            p = doc.add_paragraph()
            for i, line in enumerate(lines):
                p.add_run(line)
                if i < len(lines) - 1:
                    p.add_run("\n")
        
        # Save to export directory
        safe_name = f"{filename_prefix}{Path(doc_data.get('original_filename', 'document.docx')).stem}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.docx"
        out_path = os.path.join(settings.EXPORT_DIR, safe_name)
        doc.save(out_path)
        return out_path
