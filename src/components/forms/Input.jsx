import { cn } from '@/utils/cn';

export default function Input({ label, error, icon: Icon, className, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        )}
        <input
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
            Icon && 'pl-10',
            error && 'border-red-300 focus:ring-red-500/30 focus:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
