import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const tints = {
  primary: 'from-white to-primary-50/45 border-primary-100/60', // Soft Teal
  accent: 'from-white to-sky-50/45 border-sky-100/60', // Soft Blue
  blue: 'from-white to-amber-50/40 border-amber-100/60', // Soft Amber
  purple: 'from-white to-purple-50/45 border-purple-100/60', // Soft Lavender
};

export default function KPICard({ title, value, change, color = 'primary' }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={cn(
        "bg-gradient-to-br border p-5 shadow-card hover:shadow-card-hover transition-all duration-300 rounded-2xl",
        tints[color] || tints.primary
      )}
    >
      <div>
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {change != null && (
          <p className={cn('text-xs mt-1', change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
            {change >= 0 ? '+' : ''}{change}% vs last month
          </p>
        )}
      </div>
    </motion.div>
  );
}
