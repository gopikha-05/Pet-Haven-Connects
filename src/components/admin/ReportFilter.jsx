import { useState } from 'react';

export default function ReportFilter({ onFilterChange, selectedPeriod = '30d' }) {
  const [period, setPeriod] = useState(selectedPeriod);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    onFilterChange(newPeriod);
  };

  const periods = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'This Year' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm font-medium text-slate-600">Period:</span>
      {periods.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => handlePeriodChange(p.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            period === p.value
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
