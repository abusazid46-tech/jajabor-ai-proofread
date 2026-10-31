'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { DocumentItem } from '@/types';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  AlertCircle,
  Building,
} from 'lucide-react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [langFilter, setLangFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reanalysingId, setReanalysingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await api.getDocuments({
        status: statusFilter || undefined,
        language: langFilter || undefined,
      });
      setDocuments(docs);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.message || 'Failed to load document list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, langFilter]);

  const handleReanalyse = async (id: string) => {
    try {
      setReanalysingId(id);
      await api.analyseDocument(id, false);
      await fetchDocuments();
    } catch (err: any) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setReanalysingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.original_filename.toLowerCase().includes(q) ||
      (doc.department && doc.department.toLowerCase().includes(q)) ||
      (doc.document_type && doc.document_type.toLowerCase().includes(q))
    );
  });

  return (
    <AppShell
      title="Document Repository"
      subtitle="Registry of government publications, gazettes, and circulars undergoing quality assurance"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by name or department..."
                className="pl-9 pr-4 py-2 text-xs rounded border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 w-64 md:w-80 shadow-xs"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
            >
              <option value="">All Statuses</option>
              <option value="awaiting_review">Awaiting Review</option>
              <option value="reviewed">Reviewed &amp; Verified</option>
              <option value="ready">Ready for Analysis</option>
              <option value="failed">Extraction Failed</option>
            </select>

            {/* Language Filter */}
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="text-xs rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
            >
              <option value="">All Languages</option>
              <option value="as">অসমীয়া (Assamese)</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>

          <Link
            href="/upload"
            className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors shrink-0"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload New Document
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchDocuments} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* Documents Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Document Title &amp; Details</th>
                  <th className="py-3 px-4 font-semibold">Language</th>
                  <th className="py-3 px-4 font-semibold">Processing State</th>
                  <th className="py-3 px-4 font-semibold">Proofreading Findings</th>
                  <th className="py-3 px-4 font-semibold">Date Registered</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-teal-600" />
                      Loading document repository...
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No documents found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 flex items-center space-x-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{doc.original_filename}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {doc.document_type || 'Notification'} &bull; {(doc.file_size / 1024).toFixed(1)} KB ({doc.file_type.toUpperCase()})
                          {doc.is_sample === 1 && (
                            <span className="ml-2 px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                              Demo Sample
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                          {doc.language === 'as' ? 'অসমীয়া (AS)' : doc.language.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            doc.status === 'awaiting_review'
                              ? 'bg-amber-100 text-amber-800'
                              : doc.status === 'reviewed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.status === 'ready'
                              ? 'bg-blue-100 text-blue-800'
                              : doc.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {doc.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {doc.findings_count > 0 ? (
                          <div>
                            <span className="font-semibold text-amber-700">
                              {doc.pending_count} pending
                            </span>{' '}
                            <span className="text-slate-400">/ {doc.findings_count} total</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No issues flagged</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(doc.created_at).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Review Workspace Link */}
                          <Link
                            href={`/workspace?docId=${doc.id}`}
                            className="p-1.5 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded text-xs transition-colors title='Open Workspace'"
                            title="Open Review Workspace"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Re-run analysis */}
                          <button
                            onClick={() => handleReanalyse(doc.id)}
                            disabled={reanalysingId === doc.id}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded text-xs transition-colors"
                            title="Re-run Analysis Engine"
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${
                                reanalysingId === doc.id ? 'animate-spin text-teal-600' : ''
                              }`}
                            />
                          </button>

                          {/* Export CSV Report */}
                          <a
                            href={api.getExportUrl(doc.id, 'csv')}
                            download
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded text-xs transition-colors"
                            title="Download CSV Audit Report"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
