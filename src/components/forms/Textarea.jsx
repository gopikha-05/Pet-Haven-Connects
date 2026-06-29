import { cn } from '@/utils/cn';

export default function Textarea({ label, error, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <textarea
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 resize-none',
          error && 'border-red-300',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
