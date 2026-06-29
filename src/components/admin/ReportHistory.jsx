export default function ReportHistory({ history }) {
  const getActionLabel = (action) => {
    const labels = {
      'created': 'Created Report',
      'edited': 'Edited Summary',
      'status-changed': 'Changed Status',
      'exported': 'Exported Report',
      'archived': 'Archived Report',
      'published': 'Published Report'
    };
    return labels[action] || action;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Report History</h2>
        <p className="text-sm text-slate-500">No history available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-4">Report History</h2>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item._id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{getActionLabel(item.action)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {item.performedBy?.name || 'System'} • {formatDate(item.timestamp)}
              </p>
              {item.details && (
                <p className="text-xs text-slate-600 mt-1">{item.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
