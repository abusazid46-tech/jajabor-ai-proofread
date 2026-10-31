'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { ReportsSummaryData, AuditEventItem } from '@/types';
import {
  BarChart3,
  History,
  FileCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Download,
  Filter,
  Search,
  ShieldAlert,
  Calendar,
  Clock,
} from 'lucide-react';

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummaryData | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [sum, audits] = await Promise.all([
          api.getReportsSummary(),
          api.getAuditEvents(100),
        ]);
        setSummary(sum);
        setAuditEvents(audits);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalDecisions = (summary?.accepted_findings || 0) + (summary?.rejected_findings || 0) + (summary?.edited_findings || 0);
  const acceptanceRate = totalDecisions > 0 ? Math.round(((summary?.accepted_findings || 0) / totalDecisions) * 100) : 0;
  const editRate = totalDecisions > 0 ? Math.round(((summary?.edited_findings || 0) / totalDecisions) * 100) : 0;
  const rejectionRate = totalDecisions > 0 ? Math.round(((summary?.rejected_findings || 0) / totalDecisions) * 100) : 0;

  const filteredEvents = auditEvents.filter((ev) => {
    if (actionFilter && ev.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ev.action.toLowerCase().includes(q) ||
        ev.actor.toLowerCase().includes(q) ||
        (ev.details && ev.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <AppShell
      title="Verification Audit Trail &amp; Quality Metrics"
      subtitle="Complete chronological history of document processing and proofreader decisions"
    >
      <div className="space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Proofreading Findings
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {summary?.total_findings || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across all uploaded documents</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reviewer Acceptance Rate
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              {acceptanceRate}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary?.accepted_findings || 0} accepted of {totalDecisions} decided
            </p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Custom Manual Edits
            </span>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {summary?.edited_findings || 0} ({editRate}%)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Proofreader fine-tuned suggestions</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rejected Suggestions
            </span>
            <div className="text-2xl font-bold text-red-600 mt-2">
              {summary?.rejected_findings || 0} ({rejectionRate}%)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Proofreader retained original document text</p>
          </div>
        </div>

        {/* Audit Trail Disclaimer */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Audit Trail Notice:</strong> This audit trail is an internal prototype record of system and reviewer actions. It does not constitute a legally certified timestamp under the IT Act.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Backend Event Log</span>
        </div>

        {/* Audit Events Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-sm text-slate-900">
                Chronological Activity Log ({filteredEvents.length} events)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter events..."
                  className="pl-8 pr-3 py-1 text-xs rounded border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 w-48"
                />
              </div>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="text-xs rounded border border-slate-300 bg-white px-2 py-1 text-slate-800"
              >
                <option value="">All Action Types</option>
                <option value="document_uploaded">Document Uploaded</option>
                <option value="text_extracted">Text Extracted</option>
                <option value="analysis_started">Analysis Started</option>
                <option value="analysis_completed">Analysis Completed</option>
                <option value="finding_accepted">Finding Accepted</option>
                <option value="finding_rejected">Finding Rejected</option>
                <option value="suggestion_edited">Suggestion Edited</option>
                <option value="review_completed">Review Completed</option>
                <option value="export_generated">Export Generated</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                  <th className="py-2.5 px-3 font-semibold">Actor / Role</th>
                  <th className="py-2.5 px-3 font-semibold">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No audit events match current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => {
                    const actionBadge = {
                      document_uploaded: 'bg-blue-100 text-blue-800',
                      text_extracted: 'bg-slate-100 text-slate-800',
                      analysis_completed: 'bg-indigo-100 text-indigo-800',
                      finding_accepted: 'bg-emerald-100 text-emerald-800',
                      finding_rejected: 'bg-red-100 text-red-800',
                      suggestion_edited: 'bg-amber-100 text-amber-800',
                      review_completed: 'bg-teal-100 text-teal-800',
                      export_generated: 'bg-purple-100 text-purple-800',
                    }[ev.action] || 'bg-slate-100 text-slate-700';

                    return (
                      <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(ev.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${actionBadge}`}
                          >
                            {ev.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {ev.actor}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs">
                          {ev.details || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
