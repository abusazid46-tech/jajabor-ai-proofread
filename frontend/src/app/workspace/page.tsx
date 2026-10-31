'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { DocumentItem, FindingItem } from '@/types';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  RotateCcw,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  CheckCheck,
  FileCheck,
  Languages,
  Info,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryDocId = searchParams.get('docId');

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(queryDocId || '');
  const [currentDoc, setCurrentDoc] = useState<DocumentItem | null>(null);
  const [findings, setFindings] = useState<FindingItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reviewed' | 'original'>('reviewed');

  // Filters & Search
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit Suggestion Modal State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Bulk Accept confirmation
  const [showBulkConfirm, setShowBulkConfirm] = useState<boolean>(false);

  // Load all documents for switcher
  useEffect(() => {
    async function loadDocs() {
      try {
        const docs = await api.getDocuments();
        setDocuments(docs);
        if (!selectedDocId && docs.length > 0) {
          setSelectedDocId(docs[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load documents:', err);
      }
    }
    loadDocs();
  }, []);

  // Load document and findings whenever selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;

    async function loadWorkspaceData() {
      try {
        setLoading(true);
        setError(null);
        const [doc, findingsList] = await Promise.all([
          api.getDocument(selectedDocId),
          api.getFindings(selectedDocId),
        ]);
        setCurrentDoc(doc);
        setFindings(findingsList);
        setSelectedIndex(0);
      } catch (err: any) {
        console.error('Failed to load workspace data:', err);
        setError(err.message || 'Failed to load document findings.');
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaceData();
  }, [selectedDocId]);

  // Filtered findings list
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (categoryFilter && f.category !== categoryFilter) return false;
      if (statusFilter && f.review_status !== statusFilter) return false;
      if (severityFilter && f.severity !== severityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          f.original_text.toLowerCase().includes(q) ||
          (f.suggested_correction && f.suggested_correction.toLowerCase().includes(q)) ||
          f.explanation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [findings, categoryFilter, statusFilter, severityFilter, searchQuery]);

  const activeFinding = filteredFindings[selectedIndex] || null;

  // Actions
  const handleDecision = async (
    findingId: string,
    status: 'accepted' | 'rejected' | 'edited' | 'pending',
    customCorrection?: string
  ) => {
    try {
      setActionLoading(true);
      const updated = await api.patchFinding(findingId, status, customCorrection);
      
      // Update local findings state
      setFindings((prev) =>
        prev.map((f) => (f.id === findingId ? updated : f))
      );

      // Refresh parent doc's reviewed_text
      const freshDoc = await api.getDocument(selectedDocId);
      setCurrentDoc(freshDoc);

      // Auto-advance to next finding if currently in list
      if (selectedIndex < filteredFindings.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
      setIsEditing(false);
    }
  };

  const handleBulkAccept = async () => {
    try {
      setActionLoading(true);
      await api.reviewDocument(selectedDocId, 'bulk_accept');
      // Refresh findings and doc
      const [freshDoc, freshFindings] = await Promise.all([
        api.getDocument(selectedDocId),
        api.getFindings(selectedDocId),
      ]);
      setCurrentDoc(freshDoc);
      setFindings(freshFindings);
      setShowBulkConfirm(false);
    } catch (err: any) {
      alert(`Bulk accept failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteReview = async () => {
    try {
      setActionLoading(true);
      await api.reviewDocument(selectedDocId, 'complete_review');
      const freshDoc = await api.getDocument(selectedDocId);
      setCurrentDoc(freshDoc);
      alert('Document review status marked as COMPLETED and verified.');
    } catch (err: any) {
      alert(`Failed to complete review: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Status counts
  const counts = useMemo(() => {
    return {
      total: findings.length,
      pending: findings.filter((f) => f.review_status === 'pending').length,
      accepted: findings.filter((f) => f.review_status === 'accepted').length,
      rejected: findings.filter((f) => f.review_status === 'rejected').length,
      edited: findings.filter((f) => f.review_status === 'edited').length,
    };
  }, [findings]);

  return (
    <AppShell
      title="Proofreading &amp; Quality Review Workspace"
      subtitle="Interactive verification console for government notifications and circulars"
    >
      <div className="space-y-4">
        {/* Workspace Top Bar: Document Selection, Status & Export Actions */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Active Document:</label>
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                router.push(`/workspace?docId=${e.target.value}`);
              }}
              className="text-xs rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-800 font-medium max-w-sm truncate focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename} ({d.language.toUpperCase()})
                </option>
              ))}
            </select>

            {currentDoc && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                  currentDoc.status === 'reviewed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentDoc.status.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Accept button */}
            <button
              onClick={() => setShowBulkConfirm(true)}
              disabled={counts.pending === 0 || actionLoading}
              className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-medium rounded transition-colors"
              title="Bulk accept remaining pending suggestions"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1 text-teal-600" />
              Bulk Accept Pending ({counts.pending})
            </button>

            {/* Mark Review Completed */}
            <button
              onClick={handleCompleteReview}
              disabled={actionLoading || currentDoc?.status === 'reviewed'}
              className="inline-flex items-center px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold rounded shadow-xs transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 mr-1" />
              {currentDoc?.status === 'reviewed' ? 'Review Verified' : 'Complete Review'}
            </button>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-200">
              <a
                href={api.getExportUrl(selectedDocId, 'csv')}
                download
                className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded shadow-xs"
                title="Download CSV Audit Report"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
                CSV
              </a>
              <a
                href={api.getExportUrl(selectedDocId, 'html')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded shadow-xs"
                title="View HTML Verification Report"
              >
                HTML
              </a>
              <a
                href={api.getExportUrl(selectedDocId, 'docx')}
                download
                className="inline-flex items-center px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded shadow-xs"
                title="Download Clean Reviewed DOCX Document"
              >
                DOCX
              </a>
            </div>
          </div>
        </div>

        {/* Mandatory Quality / Responsibility Banner */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Proofreader Verification Reminder:</strong> Automated suggestions may be incorrect. Verify all corrections before official gazette publication or departmental dissemination.
            </span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium shrink-0 ml-2">
            Human-in-the-Loop Mode
          </span>
        </div>

        {/* Three-Panel Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-280px)] min-h-[550px]">
          {/* LEFT PANEL: Issue List & Filters (3 Cols) */}
          <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                  Findings ({counts.total})
                </span>
                <span className="text-[11px] text-slate-500">
                  {counts.accepted} accepted &bull; {counts.rejected} rejected
                </span>
              </div>

              {/* Search & Category Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search findings..."
                    className="w-full pl-8 pr-2 py-1 text-[11px] rounded border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-[11px] rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
                  >
                    <option value="">All Categories</option>
                    <option value="spelling">Spelling</option>
                    <option value="grammar">Grammar</option>
                    <option value="punctuation">Punctuation</option>
                    <option value="repeated_words">Repeated Words</option>
                    <option value="whitespace">Whitespace</option>
                    <option value="terminology">Terminology</option>
                    <option value="number_date">Number / Date</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[11px] rounded border border-slate-300 bg-white px-2 py-1 text-slate-700"
                  >
                    <option value="">All Decisions</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                    <option value="edited">Edited</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Findings List Scrollable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
              {filteredFindings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No findings match current filter criteria.
                </div>
              ) : (
                filteredFindings.map((finding, idx) => {
                  const isSelected = activeFinding?.id === finding.id;
                  const statusColors = {
                    pending: 'bg-amber-100 text-amber-800 border-amber-200',
                    accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    rejected: 'bg-red-100 text-red-800 border-red-200',
                    edited: 'bg-blue-100 text-blue-800 border-blue-200',
                  }[finding.review_status];

                  return (
                    <div
                      key={finding.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`p-2.5 rounded-md text-xs cursor-pointer transition-colors mb-1 ${
                        isSelected
                          ? 'bg-teal-50 border border-teal-300 shadow-xs'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-700 uppercase tracking-tight text-[10px]">
                          {finding.category.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded border text-[10px] font-semibold uppercase ${statusColors}`}
                        >
                          {finding.review_status}
                        </span>
                      </div>
                      <div className="font-mono text-slate-900 truncate">
                        <span className="line-through text-red-600 mr-1.5">{finding.original_text}</span>
                        <span className="text-emerald-700 font-semibold">
                          &rarr; {finding.user_edited_correction || finding.suggested_correction || '—'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {finding.explanation}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CENTRE PANEL: Extracted Document Text Display (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('reviewed')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    activeTab === 'reviewed'
                      ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Proposed Reviewed Text
                </button>
                <button
                  onClick={() => setActiveTab('original')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    activeTab === 'original'
                      ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Original Extracted Text
                </button>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center space-x-1 text-xs text-slate-600">
                <button
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex <= 0}
                  className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded"
                  title="Previous finding"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-medium">
                  {filteredFindings.length > 0 ? selectedIndex + 1 : 0} of {filteredFindings.length}
                </span>
                <button
                  onClick={() => setSelectedIndex(Math.min(filteredFindings.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex >= filteredFindings.length - 1}
                  className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded"
                  title="Next finding"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content View */}
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap bg-slate-50/40 assamese-text">
              {activeTab === 'reviewed'
                ? currentDoc?.reviewed_text || currentDoc?.original_text || 'No text extracted.'
                : currentDoc?.original_text || 'No original text available.'}
            </div>

            <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Language: <strong>{currentDoc?.language.toUpperCase()}</strong>
              </span>
              <span>
                Character count: {activeTab === 'reviewed' ? currentDoc?.reviewed_text?.length : currentDoc?.original_text?.length}
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: Detailed Finding Inspection & Actions (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                Inspection &amp; Decision Card
              </span>
              {activeFinding && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-800 uppercase">
                  {activeFinding.severity} priority
                </span>
              )}
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {activeFinding ? (
                <>
                  {/* Category & Rule Method */}
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold capitalize mb-1">
                      {activeFinding.category.replace('_', ' ')}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      Method: <span className="font-mono text-slate-600">{activeFinding.detection_method}</span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-red-700 uppercase tracking-wider block mb-1">
                        Original Document Passage:
                      </label>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-900 font-mono text-xs whitespace-pre-wrap assamese-text">
                        {activeFinding.original_text}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
                        Recommended Correction:
                      </label>
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 font-mono text-xs whitespace-pre-wrap font-semibold assamese-text">
                        {activeFinding.user_edited_correction || activeFinding.suggested_correction || '[Delete / Clean Whitespace]'}
                      </div>
                    </div>
                  </div>

                  {/* Surrounding Context */}
                  {activeFinding.context && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Context Reference:
                      </label>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-mono italic assamese-text">
                        {activeFinding.context}
                      </div>
                    </div>
                  )}

                  {/* Linguistic / Style Explanation */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Rule Explanation &amp; Rationale:
                    </label>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                      {activeFinding.explanation}
                    </p>
                  </div>

                  {/* Inline Edit Form if in editing mode */}
                  {isEditing && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                      <label className="text-xs font-semibold text-blue-900 block">
                        Custom User Correction:
                      </label>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-xs font-mono p-2 border border-blue-300 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 assamese-text"
                        placeholder="Enter modified correction..."
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDecision(activeFinding.id, 'edited', editText)}
                          disabled={actionLoading || !editText.trim()}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                        >
                          Save Custom Edit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleDecision(activeFinding.id, 'accepted')}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Accept Correction
                      </button>

                      <button
                        onClick={() => handleDecision(activeFinding.id, 'rejected')}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded shadow-xs transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Reject (Keep Original)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setEditText(
                            activeFinding.user_edited_correction ||
                            activeFinding.suggested_correction ||
                            activeFinding.original_text
                          );
                          setIsEditing(!isEditing);
                        }}
                        className="inline-flex items-center justify-center px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Edit Suggestion
                      </button>

                      <button
                        onClick={() => handleDecision(activeFinding.id, 'pending')}
                        disabled={actionLoading || activeFinding.review_status === 'pending'}
                        className="inline-flex items-center justify-center px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-40"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Reset Decision
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a finding from the left panel to inspect details and apply corrections.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Accept Modal */}
        {showBulkConfirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center space-x-3 text-amber-700">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Bulk Acceptance
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to accept all <strong>{counts.pending}</strong> remaining pending suggestions for this document.
                <br /><br />
                <strong>Note:</strong> Bulk acceptance is provided as a reviewer convenience only. In official government publications, the proofreader retains full legal and professional responsibility for all approved corrections.
              </p>
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowBulkConfirm(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAccept}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                >
                  Confirm &amp; Accept All Pending
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Review Workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
