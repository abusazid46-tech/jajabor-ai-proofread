import {
  DocumentItem,
  FindingItem,
  TerminologyItem,
  AuditEventItem,
  ReportsSummaryData,
} from '@/types';

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
        return process.env.NEXT_PUBLIC_API_URL;
      }
      return 'https://jajabor-ai-proofread.onrender.com/api';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
}

const API_BASE = getApiBase();

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    return handleResponse<any>(res);
  },

  async getDocuments(params?: { status?: string; language?: string }): Promise<DocumentItem[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.language) query.set('language', params.language);
    const res = await fetch(`${API_BASE}/documents?${query.toString()}`, { cache: 'no-store' });
    return handleResponse<DocumentItem[]>(res);
  },

  async getDocument(id: string): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { cache: 'no-store' });
    return handleResponse<DocumentItem>(res);
  },

  async getDocumentText(id: string): Promise<{ id: string; original_text: string; reviewed_text: string; status: string; language: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}/text`, { cache: 'no-store' });
    return handleResponse(res);
  },

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<DocumentItem>(res);
  },

  async analyseDocument(id: string, useAi: boolean = false): Promise<{ status: string; document_id: string; findings_count: number; document_status: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}/analyse?use_ai=${useAi}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async getFindings(id: string, filters?: { category?: string; status?: string; severity?: string }): Promise<FindingItem[]> {
    const query = new URLSearchParams();
    if (filters?.category) query.set('category', filters.category);
    if (filters?.status) query.set('status', filters.status);
    if (filters?.severity) query.set('severity', filters.severity);
    const res = await fetch(`${API_BASE}/documents/${id}/findings?${query.toString()}`, { cache: 'no-store' });
    return handleResponse<FindingItem[]>(res);
  },

  async patchFinding(id: string, status: 'accepted' | 'rejected' | 'edited' | 'pending', userEditedCorrection?: string): Promise<FindingItem> {
    const res = await fetch(`${API_BASE}/findings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_status: status,
        user_edited_correction: userEditedCorrection,
      }),
    });
    return handleResponse<FindingItem>(res);
  },

  async reviewDocument(id: string, action: 'complete_review' | 'bulk_accept', note?: string): Promise<{ status: string; document_status: string }> {
    const res = await fetch(`${API_BASE}/documents/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, note }),
    });
    return handleResponse(res);
  },

  async getDocumentHistory(id: string): Promise<AuditEventItem[]> {
    const res = await fetch(`${API_BASE}/documents/${id}/history`, { cache: 'no-store' });
    return handleResponse<AuditEventItem[]>(res);
  },

  getExportUrl(id: string, format: 'csv' | 'html' | 'docx'): string {
    return `${API_BASE}/documents/${id}/export?format=${format}`;
  },

  async getTerminology(params?: { language?: string; search?: string }): Promise<TerminologyItem[]> {
    const query = new URLSearchParams();
    if (params?.language) query.set('language', params.language);
    if (params?.search) query.set('search', params.search);
    const res = await fetch(`${API_BASE}/terminology?${query.toString()}`, { cache: 'no-store' });
    return handleResponse<TerminologyItem[]>(res);
  },

  async createTerminology(data: { approved_term: string; disallowed_variants: string; language: string; category: string; explanation?: string }): Promise<TerminologyItem> {
    const res = await fetch(`${API_BASE}/terminology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<TerminologyItem>(res);
  },

  async updateTerminology(id: string, data: Partial<TerminologyItem>): Promise<TerminologyItem> {
    const res = await fetch(`${API_BASE}/terminology/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<TerminologyItem>(res);
  },

  async deleteTerminology(id: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/terminology/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async getReportsSummary(): Promise<ReportsSummaryData> {
    const res = await fetch(`${API_BASE}/reports/summary`, { cache: 'no-store' });
    return handleResponse<ReportsSummaryData>(res);
  },

  async getAuditEvents(limit: number = 50): Promise<AuditEventItem[]> {
    const res = await fetch(`${API_BASE}/audit?limit=${limit}`, { cache: 'no-store' });
    return handleResponse<AuditEventItem[]>(res);
  },
};
