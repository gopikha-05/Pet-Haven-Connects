import { APPLICATION_STATUS_COLORS, APPLICATION_STATUS_LABELS } from '@/constants/status';
import { cn } from '@/utils/cn';

export default function StatusBadge({ status }) {
  return (
    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', APPLICATION_STATUS_COLORS[status] || 'bg-slate-100 text-slate-700')}>
      {APPLICATION_STATUS_LABELS[status] || status}
    </span>
  );
}
