'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { ReportsSummaryData, DocumentItem } from '@/types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ArrowRight,
  BookOpen,
  Sparkles,
  History,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<ReportsSummaryData | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [sumData, docs] = await Promise.all([
          api.getReportsSummary(),
          api.getDocuments(),
        ]);
        setSummary(sumData);
        setRecentDocs(docs.slice(0, 5));
      } catch (err: any) {
        console.error('Failed to load dashboard:', err);
        setError(err.message || 'Could not connect to proofreading backend');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  return (
    <AppShell
      title="Administrative Overview"
      subtitle="Multilingual Document Quality Assurance & Proofreading Management"
    >
      {/* Government Challenge Notice Banner */}
      <div className="mb-6 p-4 rounded-lg bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-md shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              NESFIC 2026 Innovation Challenge (NESFIC-D-38) &mdash; Innovation Prototype
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Faster, More Consistent Multilingual Proofreading of Government Documents for the Directorate of Printing &amp; Stationery, Assam.
              Demonstrates human-in-the-loop review with deterministic orthography validation.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Offline Deterministic Fallback Active
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Documents Processed
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '...' : summary?.total_documents ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Persisted in local registry</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Awaiting Review
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">
              {loading ? '...' : summary?.awaiting_review ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Documents pending decision</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Suggestions Pending
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-600">
              {loading ? '...' : summary?.pending_findings ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Accepted: {summary?.accepted_findings ?? 0} | Rejected: {summary?.rejected_findings ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Reviewed &amp; Approved
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">
              {loading ? '...' : summary?.reviewed_documents ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Completed human verification</p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-medium text-slate-700">Quick Actions:</div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/upload"
            className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload Document
          </Link>
          <Link
            href="/documents"
            className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Start Proofreading
          </Link>
          <Link
            href="/workspace"
            className="inline-flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-md shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 text-teal-600" />
            Open Review Workspace
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Documents & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Documents Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900">Recent Document Activity</h3>
            <Link
              href="/documents"
              className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center"
            >
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Document Title</th>
                  <th className="py-2.5 px-4 font-semibold">Language</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Findings</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No documents in database yet. Click "Upload Document" to start.
                    </td>
                  </tr>
                ) : (
                  recentDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 truncate max-w-[240px]">
                          {doc.original_filename}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {doc.document_type || 'Notification'} &bull; {(doc.file_size / 1024).toFixed(1)} KB
                          {doc.is_sample === 1 && (
                            <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-slate-100 text-slate-600 rounded">
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
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {doc.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {doc.findings_count > 0 ? (
                          <span className="text-amber-700 font-semibold">
                            {doc.pending_count} pending / {doc.findings_count} total
                          </span>
                        ) : (
                          <span className="text-slate-400">None detected</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/workspace?docId=${doc.id}`}
                          className="inline-flex items-center px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded font-medium text-[11px] transition-colors"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Issue Category Distribution (1 Col) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 mb-1">
              Issue Category Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Breakdown of findings flagged across documents
            </p>

            <div className="space-y-3">
              {summary && summary.findings_by_category && Object.keys(summary.findings_by_category).length > 0 ? (
                Object.entries(summary.findings_by_category).map(([category, count]) => {
                  const total = summary.total_findings || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span className="capitalize">{category.replace('_', ' ')}</span>
                        <span>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-600 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No issues analyzed yet. Run analysis on a document to see category distribution.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Rule Engine Coverage:</span>
              <span className="font-semibold text-teal-700">7 Core Categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Audit Timeline preview */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-sm text-slate-900">Recent Proofreading Audit Log</h3>
          </div>
          <Link href="/reports" className="text-xs font-medium text-teal-600 hover:text-teal-700">
            Full Audit History &rarr;
          </Link>
        </div>

        <div className="space-y-2.5">
          {summary?.recent_activity && summary.recent_activity.length > 0 ? (
            summary.recent_activity.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between p-2.5 bg-slate-50 rounded border border-slate-100 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800 uppercase tracking-wide text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded mr-2">
                    {act.action.replace('_', ' ')}
                  </span>
                  <span className="text-slate-600">{act.details || 'Event logged'}</span>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0 ml-4">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 py-3 text-center">
              No audit events logged yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
