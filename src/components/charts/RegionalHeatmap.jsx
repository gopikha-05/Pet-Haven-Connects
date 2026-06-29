import { cn } from '@/utils/cn';

export default function RegionalHeatmap({ data }) {
  const maxDemand = Math.max(...data.map((d) => d.demand));
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.map((region) => {
        const intensity = region.demand / maxDemand;
        return (
          <div
            key={region.region}
            className={cn(
              'rounded-xl p-4 border transition hover:scale-[1.02]',
              intensity > 0.8 ? 'bg-primary-600 text-white border-primary-700' :
              intensity > 0.6 ? 'bg-primary-400 text-white border-primary-500' :
              intensity > 0.4 ? 'bg-primary-200 text-primary-900 border-primary-300' :
              'bg-primary-50 text-primary-800 border-primary-100'
            )}
          >
            <p className="font-semibold">{region.region}</p>
            <p className="text-sm opacity-90 mt-1">Demand: {region.demand}%</p>
            <p className="text-xs opacity-75">{region.adoptions} adoptions</p>
          </div>
        );
      })}
    </div>
  );
}
