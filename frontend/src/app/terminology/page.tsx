'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { TerminologyItem } from '@/types';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Languages,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';

export default function TerminologyPage() {
  const [terms, setTerms] = useState<TerminologyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add/Edit Term Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    approved_term: '',
    disallowed_variants: '',
    language: 'as',
    category: 'Administrative Orthography',
    explanation: '',
  });

  const fetchTerminology = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTerminology({
        language: languageFilter || undefined,
        search: searchQuery || undefined,
      });
      setTerms(data);
    } catch (err: any) {
      console.error('Failed to load terminology:', err);
      setError(err.message || 'Failed to load terminology dictionary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminology();
  }, [languageFilter, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.approved_term.trim() || !formData.disallowed_variants.trim()) {
      alert('Approved term and disallowed variants are required.');
      return;
    }

    try {
      if (editId) {
        await api.updateTerminology(editId, formData);
      } else {
        await api.createTerminology(formData);
      }
      setShowModal(false);
      setEditId(null);
      setFormData({
        approved_term: '',
        disallowed_variants: '',
        language: 'as',
        category: 'Administrative Orthography',
        explanation: '',
      });
      await fetchTerminology();
    } catch (err: any) {
      alert(`Error saving terminology: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, term: string) => {
    if (!confirm(`Are you sure you want to delete terminology entry for '${term}'?`)) return;
    try {
      await api.deleteTerminology(id);
      await fetchTerminology();
    } catch (err: any) {
      alert(`Error deleting entry: ${err.message}`);
    }
  };

  const openEditModal = (item: TerminologyItem) => {
    setEditId(item.id);
    setFormData({
      approved_term: item.approved_term,
      disallowed_variants: item.disallowed_variants,
      language: item.language,
      category: item.category,
      explanation: item.explanation || '',
    });
    setShowModal(true);
  };

  return (
    <AppShell
      title="Terminology &amp; Orthography Glossaries"
      subtitle="Standardized gazette vocabulary and departmental dictionary rules"
    >
      <div className="space-y-6">
        {/* Explanation Alert */}
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-xs flex items-start space-x-3">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Active Proofreading Integration:</strong> All entries configured here are automatically matched by the proofreading engine using Unicode-aware word boundary detection. Initial sample entries reflect modern Assamese orthographic standards (e.g. Asam Sahitya Sabha reph non-gemination guidelines) and are clearly marked as demonstration data.
          </div>
        </div>

        {/* Filter & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search approved terms or variants..."
                className="pl-9 pr-4 py-2 text-xs rounded border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 w-64 md:w-80 shadow-xs"
              />
            </div>

            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="text-xs rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-xs"
            >
              <option value="">All Languages</option>
              <option value="as">অসমীয়া (Assamese)</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>

          <button
            onClick={() => {
              setEditId(null);
              setFormData({
                approved_term: '',
                disallowed_variants: '',
                language: 'as',
                category: 'Administrative Orthography',
                explanation: '',
              });
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Terminology Rule
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
            {error}
          </div>
        )}

        {/* Terminology Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Approved Standard Term</th>
                  <th className="py-3 px-4 font-semibold">Disallowed / Inconsistent Variants</th>
                  <th className="py-3 px-4 font-semibold">Language</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Style Rationale / Explanation</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading terminology rules...
                    </td>
                  </tr>
                ) : terms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No terminology entries found. Click "Add Terminology Rule" to create one.
                    </td>
                  </tr>
                ) : (
                  terms.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-emerald-800 text-sm assamese-text">
                        {item.approved_term}
                        {item.is_sample === 1 && (
                          <span className="ml-2 px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-normal">
                            Sample Rule
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-red-700 font-mono assamese-text">
                        {item.disallowed_variants}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                          {item.language === 'as' ? 'অসমীয়া (AS)' : item.language.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs max-w-sm">
                        {item.explanation || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded text-xs transition-colors"
                            title="Edit Rule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.approved_term)}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded text-xs transition-colors"
                            title="Delete Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add / Edit Term */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                {editId ? 'Edit Terminology Rule' : 'Add Approved Terminology Rule'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approved Official Term *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.approved_term}
                    onChange={(e) => setFormData({ ...formData, approved_term: e.target.value })}
                    className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 font-medium assamese-text focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. কাৰ্যালয় or Directorate"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Disallowed / Inconsistent Variants (comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.disallowed_variants}
                    onChange={(e) => setFormData({ ...formData, disallowed_variants: e.target.value })}
                    className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 font-mono assamese-text focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. কাৰ্য্যালয়, কাৰয্যালয় or Directrate"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Matches will flag instances of these variants and suggest the approved term.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Language</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-2 text-slate-800"
                    >
                      <option value="as">অসমীয়া (Assamese)</option>
                      <option value="en">English</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900"
                      placeholder="e.g. Administrative Orthography"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Explanation / Official Reference
                  </label>
                  <textarea
                    rows={3}
                    value={formData.explanation}
                    onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                    className="w-full text-xs rounded border border-slate-300 p-2 text-slate-900 focus:ring-1 focus:ring-teal-500"
                    placeholder="Rationale displayed to the reviewer..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                  >
                    Save Terminology Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
