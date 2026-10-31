'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { DocumentItem } from '@/types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  FileCheck,
} from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('as');
  const [department, setDepartment] = useState<string>(
    'Assam Information, Printing & Stationery Department'
  );
  const [documentType, setDocumentType] = useState<string>('Gazette Notification');
  const [useAi, setUseAi] = useState<boolean>(false);

  const [uploading, setUploading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [uploadedDoc, setUploadedDoc] = useState<DocumentItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['txt', 'docx', 'pdf'].includes(ext || '')) {
        setError('Unsupported file type. Please upload a .docx, text-based .pdf, or .txt file.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
      setUploadedDoc(null);
    }
  };

  const handleUploadAndExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('department', department);
      formData.append('document_type', documentType);

      const doc = await api.uploadDocument(formData);
      setUploadedDoc(doc);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload and extract document text.');
    } finally {
      setUploading(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!uploadedDoc) return;
    try {
      setAnalyzing(true);
      setError(null);
      await api.analyseDocument(uploadedDoc.id, useAi);
      router.push(`/workspace?docId=${uploadedDoc.id}`);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to complete proofreading analysis.');
      setAnalyzing(false);
    }
  };

  return (
    <AppShell
      title="New Proofreading Job"
      subtitle="Upload administrative documents for automated text extraction and quality audit"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Verification & Security Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-start space-x-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Document Integrity &amp; Security:</strong> Uploaded files are stored with server-generated UUIDs in a local sandbox. Original files are preserved unchanged. For PDFs, text extraction requires selectable text; scanned raster PDFs require an OCR module.
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Upload Form Card */}
        {!uploadedDoc ? (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
            <form onSubmit={handleUploadAndExtract} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Official Document (.DOCX, text .PDF, .TXT)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-lg p-8 text-center transition-colors cursor-pointer bg-slate-50/50">
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".docx,.pdf,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700">
                      {file ? file.name : 'Click to select document or drag & drop here'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: DOCX, text-based PDF, TXT (Maximum file size: 15 MB)
                    </p>
                  </label>
                </div>
                {file && (
                  <div className="mt-2 text-xs text-teal-700 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Ready to upload: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Document Metadata Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Document Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="as">অসমীয়া &mdash; Assamese (Production Rules)</option>
                    <option value="en">English (Production Rules)</option>
                    <option value="hi">हिन्दी &mdash; Hindi (Experimental Rules)</option>
                    <option value="bn">বাংলা &mdash; Bengali (Partial Rules)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Issuing Department / Directorate
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Department name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Publication Category
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full text-xs rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Gazette Notification">Gazette Notification</option>
                    <option value="Departmental Circular">Departmental Circular</option>
                    <option value="Public Notice">Public Notice</option>
                    <option value="Annual / Quarterly Report">Annual / Quarterly Report</option>
                    <option value="Administrative Letter">Administrative Letter</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="inline-flex items-center px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading &amp; Extracting...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 mr-2" />
                      Upload &amp; Extract Text
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: Extracted Text Verification & Trigger Analysis */
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 uppercase mb-1">
                  Text Extraction Successful
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  {uploadedDoc.original_filename}
                </h3>
                <p className="text-xs text-slate-500">
                  Language: <strong>{uploadedDoc.language.toUpperCase()}</strong> &bull; Size: {(uploadedDoc.file_size / 1024).toFixed(1)} KB &bull; Status: {uploadedDoc.status}
                </p>
              </div>
              <button
                onClick={() => setUploadedDoc(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Upload different file
              </button>
            </div>

            {/* Extracted Text Preview Area */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Extracted Document Text for Verification:
                </label>
                <span className="text-[11px] text-slate-400">
                  {uploadedDoc.original_text?.length || 0} characters
                </span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-md max-h-72 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed assamese-text">
                {uploadedDoc.original_text || 'No readable text was extracted.'}
              </div>
            </div>

            {/* Analysis Options */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">Deterministic Proofreading Engine</h4>
                  <p className="text-[11px] text-slate-500">
                    Executes Assamese/English spelling rules, danda spacing, gemination checks, repeated words, and terminology dictionaries.
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[11px] font-semibold rounded">
                  Enabled (Offline)
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <h4 className="text-xs font-semibold text-slate-800">Optional AI Assistant</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Runs Gemini model for deeper contextual phrasing. Disabled if no server API key configured.
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                  />
                  <span className="ml-2 text-xs text-slate-700">Include AI Check</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => router.push(`/workspace?docId=${uploadedDoc.id}`)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Skip analysis, open workspace directly
              </button>

              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={analyzing}
                className="inline-flex items-center px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Quality Audit Engine...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Run Proofreading Analysis &rarr;
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
