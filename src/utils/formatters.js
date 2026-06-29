export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date, options = {}) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export function formatTime(time) {
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM') || time.includes('am') || time.includes('pm')) return time;
  const parts = time.split(':');
  if (parts.length < 2) return time;
  const hour = parseInt(parts[0], 10);
  if (isNaN(hour)) return time;
  const minutes = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

export function formatStatusLabel(status) {
  if (!status) return '';
  
  const statusMap = {
    'pending': 'Pending',
    'assigned': 'Assigned',
    'under_review': 'Under Review',
    'waiting_for_user': 'Waiting for User',
    'waiting_for_internal_team': 'Waiting for Team',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'reopened': 'Reopened',
    'rejected': 'Rejected',
    'escalated': 'Escalated',
    'response_sent': 'Response Sent',
    'ready_for_pickup': 'Ready for Pickup',
    'out_for_delivery': 'Out for Delivery',
    'delivery_completed': 'Delivery Completed'
  };
  
  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}
