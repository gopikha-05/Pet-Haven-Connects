export default function RecentActivityPanel({ activities }) {
  const formatTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now - activityDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return activityDate.toLocaleDateString();
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="font-bold text-slate-800 mb-4">Recent Activity</h2>
        <p className="text-sm text-slate-500">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm">
      <h2 className="font-bold text-slate-800 mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity._id} className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800">
                <span className="font-medium capitalize">{activity.reportType}</span> report {activity.action}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {activity.performedBy} • {formatTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
