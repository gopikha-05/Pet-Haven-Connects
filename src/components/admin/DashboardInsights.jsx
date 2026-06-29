export default function DashboardInsights({ insights }) {
  const getInsightColor = (type) => {
    const colors = {
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-50 text-amber-700 border-amber-200',
      info: 'bg-blue-50 text-blue-700 border-blue-200',
      danger: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return colors[type] || colors.info;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded',
      medium: 'bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded',
      low: 'bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded'
    };
    return badges[priority] || badges.low;
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="font-bold text-slate-800 mb-4">Dashboard Insights</h2>
        <p className="text-sm text-slate-500">No insights available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">
      <h2 className="font-bold text-slate-800 mb-4">Dashboard Insights</h2>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">{insight.message}</p>
              <span className={getPriorityBadge(insight.priority)}>{insight.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
