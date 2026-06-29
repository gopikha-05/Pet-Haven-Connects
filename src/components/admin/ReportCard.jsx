import { motion } from 'framer-motion';

export default function ReportCard({ title, value, change, trend = 'up', color = 'primary' }) {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-rose-600',
    neutral: 'text-slate-500'
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
    >
      <div className="flex flex-col">
        <p className="text-sm text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {change != null && (
          <p className={`text-xs mt-1 ${trendColors[trend]}`}>
            {change >= 0 ? '+' : ''}{change}% vs last period
          </p>
        )}
      </div>
    </motion.div>
  );
}
