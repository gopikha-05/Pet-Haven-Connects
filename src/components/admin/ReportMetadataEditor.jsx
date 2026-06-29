import { useState } from 'react';

export default function ReportMetadataEditor({ metadata, reportType, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: metadata?.title || '',
    description: metadata?.description || '',
    executiveSummary: metadata?.executiveSummary || '',
    internalNotes: metadata?.internalNotes || '',
    recommendations: metadata?.recommendations || '',
    status: metadata?.status || 'draft'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Title is auto-generated from report type, don't allow manual override
    const reportName = reportType ? reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report' : formData.title;
    onSave({ ...formData, title: reportName });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Edit Report Metadata</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Report Title</label>
          <input
            type="text"
            value={reportType ? reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report' : formData.title}
            readOnly
            className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-600"
          />
          <p className="text-xs text-slate-500 mt-1">Title is auto-generated based on report type</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Executive Summary</label>
          <textarea
            value={formData.executiveSummary}
            onChange={(e) => handleChange('executiveSummary', e.target.value)}
            rows={4}
            placeholder="Write a business summary of this report..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Internal Notes</label>
          <textarea
            value={formData.internalNotes}
            onChange={(e) => handleChange('internalNotes', e.target.value)}
            rows={3}
            placeholder="Add confidential notes (not visible in exports)..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Recommendations</label>
          <textarea
            value={formData.recommendations}
            onChange={(e) => handleChange('recommendations', e.target.value)}
            rows={3}
            placeholder="Add actionable recommendations..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="draft">Draft</option>
            <option value="in-review">In Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
