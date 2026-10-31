'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import {
  Settings,
  ShieldCheck,
  Languages,
  Cpu,
  Key,
  Database,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeRole, setActiveRole] = useState<'proofreader' | 'reviewer' | 'admin'>('proofreader');

  return (
    <AppShell
      title="System Configuration &amp; Language Architecture"
      subtitle="Capabilities, proofreading rule coverage, and security sandbox disclosures"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Prototype Environment Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Prototype Implementation Notice (NESFIC-D-38):</strong> This deployment operates in a local sandbox mode for evaluation in the North East Startup &amp; Facilitation Innovation Challenge (NESFIC 2026). No live government intranet connectivity is assumed, and no production API keys are hardcoded.
          </div>
        </div>

        {/* Demo Role Switcher */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
          <h3 className="font-semibold text-sm text-slate-900 mb-1">
            Demonstration Role Switcher
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Simulate workflow perspectives for the innovation challenge evaluation
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setActiveRole('proofreader')}
              className={`p-4 rounded-lg border text-left transition-all ${
                activeRole === 'proofreader'
                  ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900">Proofreader</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload documents, execute analysis, review suggestions, make accept/reject decisions.
              </p>
              {activeRole === 'proofreader' && (
                <span className="inline-block mt-2 text-[10px] text-teal-700 font-semibold uppercase">
                  &bull; Active Perspective
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveRole('reviewer')}
              className={`p-4 rounded-lg border text-left transition-all ${
                activeRole === 'reviewer'
                  ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900">Reviewer / Approver</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Inspect decision history, verify proofreader outputs, mark review status as completed.
              </p>
              {activeRole === 'reviewer' && (
                <span className="inline-block mt-2 text-[10px] text-teal-700 font-semibold uppercase">
                  &bull; Active Perspective
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveRole('admin')}
              className={`p-4 rounded-lg border text-left transition-all ${
                activeRole === 'admin'
                  ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-xs text-slate-900">Administrator</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Manage terminology dictionaries, audit system events, monitor rule engine parameters.
              </p>
              {activeRole === 'admin' && (
                <span className="inline-block mt-2 text-[10px] text-teal-700 font-semibold uppercase">
                  &bull; Active Perspective
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Language Capabilities Matrix */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
          <div className="flex items-center space-x-2 mb-1">
            <Languages className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-sm text-slate-900">
              Language Engine Support Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Actual functional status of linguistic models and rule engines in this build
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Language</th>
                  <th className="py-2.5 px-3 font-semibold">Implementation Status</th>
                  <th className="py-2.5 px-3 font-semibold">Active Linguistic Checks</th>
                  <th className="py-2.5 px-3 font-semibold">Orthography Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    অসমীয়া (Assamese)
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      PRIMARY / PRODUCTION-READY
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    Danda spacing, repeated dandas, reph gemination orthography, repeated words, whitespace, terminology
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    Asam Sahitya Sabha orthography guidelines &amp; Directorate standards
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    English
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      PRIMARY / PRODUCTION-READY
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    Sentence capitalization, administrative typo dictionary, punctuation spacing, repeated words, terminology
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    Standard Official Publication Style Manual
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    हिन्दी (Hindi)
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                      EXPERIMENTAL / PARTIAL
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    Repeated words, whitespace normalization, punctuation spacing
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    Unicode Devanagari boundary heuristics
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    বাংলা (Bengali)
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                      PLANNED / PARTIAL
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    Common punctuation and repeated words
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    Planned for subsequent challenge phase
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Engine & Security Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-teal-600" />
              <h4 className="font-semibold text-xs text-slate-900">Proofreading Engine Mode</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Offline Deterministic Fallback:</strong> The core prototype executes without any external network dependency or paid API keys. All rules run server-side in Python.
            </p>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
              AI Provider config: <code>AI_PROVIDER=none</code> (Configurable via <code>.env</code> to <code>gemini</code> if an authorized key is supplied).
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-teal-600" />
              <h4 className="font-semibold text-xs text-slate-900">Data Storage &amp; Isolation</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Isolated Storage:</strong> Uploaded binary documents are stored in server-generated UUID paths in <code>backend/uploads</code>. Metadata and audit events reside in local SQLite (<code>jajabor.db</code>).
            </p>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
              Audit logging active &bull; Original files preserved unchanged &bull; Parameterized ORM queries.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
