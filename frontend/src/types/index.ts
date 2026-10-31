export interface DocumentItem {
  id: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  language: string;
  status: 'uploaded' | 'extracting' | 'ready' | 'analysing' | 'awaiting_review' | 'reviewed' | 'exported' | 'failed';
  error_message?: string | null;
  original_text?: string | null;
  reviewed_text?: string | null;
  department?: string | null;
  document_type?: string | null;
  is_sample: number;
  created_at: string;
  updated_at: string;
  findings_count: number;
  pending_count: number;
}

export interface FindingItem {
  id: string;
  document_id: string;
  language: string;
  category: 'spelling' | 'grammar' | 'punctuation' | 'repeated_words' | 'whitespace' | 'terminology' | 'number_date' | 'ocr_uncertainty';
  original_text: string;
  suggested_correction: string | null;
  user_edited_correction: string | null;
  context: string | null;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
  start_pos: number | null;
  end_pos: number | null;
  detection_method: string;
  confidence: number | null;
  review_status: 'pending' | 'accepted' | 'rejected' | 'edited';
  created_at: string;
  updated_at: string;
}

export interface TerminologyItem {
  id: string;
  approved_term: string;
  disallowed_variants: string;
  language: string;
  category: string;
  explanation: string | null;
  is_sample: number;
  created_at: string;
  updated_at: string;
}

export interface AuditEventItem {
  id: string;
  document_id: string | null;
  action: string;
  actor: string;
  finding_id: string | null;
  details: string | null;
  timestamp: string;
}

export interface ReportsSummaryData {
  total_documents: number;
  awaiting_review: number;
  reviewed_documents: number;
  total_findings: number;
  pending_findings: number;
  accepted_findings: number;
  rejected_findings: number;
  edited_findings: number;
  findings_by_category: Record<string, number>;
  findings_by_language: Record<string, number>;
  documents_by_status: Record<string, number>;
  recent_activity: Array<{
    id: string;
    document_id: string | null;
    action: string;
    actor: string;
    details: string | null;
    timestamp: string;
  }>;
}
