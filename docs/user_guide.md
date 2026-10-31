# Jajabor AI Proofread &mdash; Operator & Evaluator User Guide

## 1. Quick Demonstration Workflow (Step-by-Step)

To experience the complete prototype workflow in under 3 minutes:

1. **Access the Overview Dashboard**:
   - Open `http://localhost:3001` in your browser.
   - Inspect the real metrics derived from persisted SQLite data: Total Documents, Awaiting Review, Pending Suggestions, and Reviewed Documents.
   - Observe the issue category distribution and recent document activity table.

2. **Open the Review Workspace**:
   - Click **"Open Review Workspace"** from the top action bar, or click **"Review"** next to the pre-seeded Assamese notification sample (`DEMO_Assam_Printing_Notification_Assamese.txt`).

3. **Verify Interactive Decision Making**:
   - **Left Panel**: Browse the detected findings (spelling, repeated words, danda spacing, whitespace, terminology).
   - **Center Panel**: Observe the extracted Assamese text with active highlight. Toggle between *Proposed Reviewed Text* and *Original Extracted Text*.
   - **Right Panel**: Inspect the side-by-side comparison (original text highlighted in red, recommended correction highlighted in green).
   - **Accept a Suggestion**: Click **"Accept Correction"** on the terminology finding (`কাৰ্য্যালয়ৰ` &rarr; `কাৰ্যালয়ৰ`). Notice the proposed reviewed text updates instantly and the decision badge becomes `ACCEPTED`.
   - **Reject a Suggestion**: Select the repeated word finding (`আদেশ আদেশ`) and click **"Reject (Keep Original)"**. Notice the status updates to `REJECTED` and the original text remains intact.
   - **Edit a Suggestion**: Select another finding, click **"Edit Suggestion"**, modify the text in the inline editor, and click **"Save Custom Edit"**. Notice the decision is persisted as `EDITED`.

4. **Audit History & Verification**:
   - Open **"Reports & History"** in the sidebar.
   - Notice that every acceptance, rejection, and edit action was logged with UTC timestamp, actor, and event details.

5. **Download Export Outputs**:
   - Return to the Review Workspace or Document Library.
   - Click **CSV** to download the structured verification report.
   - Click **HTML** to inspect the printable audit certificate.
   - Click **DOCX** to download the newly generated reviewed Word document.

6. **Persistence Verification**:
   - Refresh the browser (`F5`).
   - Notice that all accepted, rejected, and edited states remain persisted.

---

## 2. Managing Terminology Rules

1. Navigate to **"Terminology"** in the sidebar.
2. View existing approved terms (e.g. `কাৰ্যালয়`, `চৰকাৰী`, `নিৰ্দেশনা`).
3. Click **"Add Terminology Rule"** to register a new approved term, its disallowed variants, language, category, and official reference.
4. Future document proofreading runs will automatically enforce these terminology rules.
